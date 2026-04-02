package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"order-service/cache"
	"order-service/db"
	"order-service/kafka"
	"order-service/models"
)

func CreateOrder(c *gin.Context) {
	var req models.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	customer, err := getCustomer(req.CustomerID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Customer not found"})
		return
	}

	product, err := getProductSnapshot(req.ProductID)
	if err != nil {
		product, err = hydrateProductSnapshot(req.ProductID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Product snapshot not found"})
			return
		}
	}

	subtotal := roundCurrency(product.Price * float64(req.Quantity))
	discountAmount := calculateDiscount(subtotal, req.DiscountCode)
	total := roundCurrency(subtotal - discountAmount)

	var order models.Order
	err = db.DB.QueryRow(
		`INSERT INTO orders (
			customer_id, product_id, quantity, status, payment_method, discount_code,
			discount_amount, subtotal, total
		) VALUES ($1, $2, $3, 'Placed', $4, $5, $6, $7, $8)
		RETURNING id, customer_id, product_id, quantity, status, payment_method, discount_code,
			discount_amount, subtotal, total, created_at`,
		req.CustomerID,
		req.ProductID,
		req.Quantity,
		req.PaymentMethod,
		strings.TrimSpace(req.DiscountCode),
		discountAmount,
		subtotal,
		total,
	).Scan(
		&order.ID,
		&order.CustomerID,
		&order.ProductID,
		&order.Quantity,
		&order.Status,
		&order.PaymentMethod,
		&order.DiscountCode,
		&order.DiscountAmount,
		&order.Subtotal,
		&order.Total,
		&order.CreatedAt,
	)
	if err != nil {
		log.Printf("[Order-Service] Failed to create order: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	order.Customer = customer
	order.Product = product

	if err := reserveInventory(order.ID, order.ProductID, order.Quantity); err != nil {
		if _, deleteErr := db.DB.Exec("DELETE FROM orders WHERE id = $1", order.ID); deleteErr != nil {
			log.Printf("[Order-Service] Failed to rollback order %d after reserve failure: %v", order.ID, deleteErr)
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	event := models.OrderEvent{
		OrderID:   order.ID,
		UserID:    order.CustomerID,
		ProductID: order.ProductID,
		Quantity:  order.Quantity,
		Status:    order.Status,
	}
	if err := kafka.PublishEvent("order.created", event); err != nil {
		log.Printf("[Order-Service] Warning: failed to publish order.created for %d: %v", order.ID, err)
	}

	cacheOrder(&order)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Order created successfully",
		"order":   order,
	})
}

func GetOrder(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	cacheKey := fmt.Sprintf("order:%d", id)
	cached, err := cache.Client.Get(cache.Ctx, cacheKey).Result()
	if err == nil {
		var order models.Order
		if jsonErr := json.Unmarshal([]byte(cached), &order); jsonErr == nil {
			c.JSON(http.StatusOK, gin.H{"order": order, "source": "cache"})
			return
		}
	}

	order, err := fetchOrderByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Order #%d not found", id)})
		return
	}

	cacheOrder(&order)
	c.JSON(http.StatusOK, gin.H{"order": order, "source": "database"})
}

func ListOrders(c *gin.Context) {
	rows, err := db.DB.Query(`
		SELECT o.id, o.customer_id, o.product_id, o.quantity, o.status, o.payment_method,
			o.discount_code, o.discount_amount, o.subtotal, o.total, o.created_at,
			c.id, c.name, c.email, c.avatar,
			p.id, p.name, p.sku, p.category, p.image, p.price
		FROM orders o
		JOIN customers c ON c.id = o.customer_id
		JOIN product_snapshots p ON p.id = o.product_id
		ORDER BY o.created_at DESC
		LIMIT 100
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		order, scanErr := scanOrder(rows)
		if scanErr == nil {
			orders = append(orders, order)
		}
	}

	c.JSON(http.StatusOK, gin.H{"orders": orders, "count": len(orders)})
}

func ListCustomers(c *gin.Context) {
	rows, err := db.DB.Query("SELECT id, name, email, avatar FROM customers ORDER BY name")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch customers"})
		return
	}
	defer rows.Close()

	customers := make([]models.Customer, 0)
	for rows.Next() {
		var customer models.Customer
		if scanErr := rows.Scan(&customer.ID, &customer.Name, &customer.Email, &customer.Avatar); scanErr == nil {
			customers = append(customers, customer)
		}
	}

	c.JSON(http.StatusOK, gin.H{"customers": customers})
}

func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"service": "order-service",
		"status":  "healthy",
		"time":    time.Now(),
	})
}

func fetchOrderByID(id int) (models.Order, error) {
	row := db.DB.QueryRow(`
		SELECT o.id, o.customer_id, o.product_id, o.quantity, o.status, o.payment_method,
			o.discount_code, o.discount_amount, o.subtotal, o.total, o.created_at,
			c.id, c.name, c.email, c.avatar,
			p.id, p.name, p.sku, p.category, p.image, p.price
		FROM orders o
		JOIN customers c ON c.id = o.customer_id
		JOIN product_snapshots p ON p.id = o.product_id
		WHERE o.id = $1
	`, id)
	return scanOrder(row)
}

type scanner interface {
	Scan(dest ...interface{}) error
}

func scanOrder(s scanner) (models.Order, error) {
	var order models.Order
	err := s.Scan(
		&order.ID,
		&order.CustomerID,
		&order.ProductID,
		&order.Quantity,
		&order.Status,
		&order.PaymentMethod,
		&order.DiscountCode,
		&order.DiscountAmount,
		&order.Subtotal,
		&order.Total,
		&order.CreatedAt,
		&order.Customer.ID,
		&order.Customer.Name,
		&order.Customer.Email,
		&order.Customer.Avatar,
		&order.Product.ID,
		&order.Product.Name,
		&order.Product.SKU,
		&order.Product.Category,
		&order.Product.Image,
		&order.Product.Price,
	)
	return order, err
}

func getCustomer(id int) (models.Customer, error) {
	var customer models.Customer
	err := db.DB.QueryRow("SELECT id, name, email, avatar FROM customers WHERE id = $1", id).
		Scan(&customer.ID, &customer.Name, &customer.Email, &customer.Avatar)
	return customer, err
}

func getProductSnapshot(id int) (models.ProductSnapshot, error) {
	var product models.ProductSnapshot
	err := db.DB.QueryRow("SELECT id, name, sku, category, image, price FROM product_snapshots WHERE id = $1", id).
		Scan(&product.ID, &product.Name, &product.SKU, &product.Category, &product.Image, &product.Price)
	return product, err
}

func hydrateProductSnapshot(id int) (models.ProductSnapshot, error) {
	baseURL := os.Getenv("INVENTORY_SERVICE_URL")
	if baseURL == "" {
		baseURL = "http://inventory-service:8082"
	}

	response, err := http.Get(fmt.Sprintf("%s/inventory/%d", strings.TrimRight(baseURL, "/"), id))
	if err != nil {
		return models.ProductSnapshot{}, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(response.Body)
		return models.ProductSnapshot{}, fmt.Errorf("inventory lookup failed: %s", strings.TrimSpace(string(body)))
	}

	var payload struct {
		Product struct {
			ID       int     `json:"id"`
			Name     string  `json:"name"`
			SKU      string  `json:"sku"`
			Category string  `json:"category"`
			Image    string  `json:"image"`
			Price    float64 `json:"price"`
		} `json:"product"`
	}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		return models.ProductSnapshot{}, err
	}

	product := models.ProductSnapshot{
		ID:       payload.Product.ID,
		Name:     payload.Product.Name,
		SKU:      payload.Product.SKU,
		Category: payload.Product.Category,
		Image:    payload.Product.Image,
		Price:    payload.Product.Price,
	}

	_, err = db.DB.Exec(`
		INSERT INTO product_snapshots (id, name, sku, category, image, price)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			sku = EXCLUDED.sku,
			category = EXCLUDED.category,
			image = EXCLUDED.image,
			price = EXCLUDED.price
	`, product.ID, product.Name, product.SKU, product.Category, product.Image, product.Price)
	if err != nil {
		return models.ProductSnapshot{}, err
	}

	return product, nil
}

func reserveInventory(orderID, productID, quantity int) error {
	baseURL := os.Getenv("INVENTORY_SERVICE_URL")
	if baseURL == "" {
		baseURL = "http://inventory-service:8082"
	}

	payload, err := json.Marshal(map[string]int{
		"order_id":   orderID,
		"product_id": productID,
		"quantity":   quantity,
	})
	if err != nil {
		return err
	}

	response, err := http.Post(
		fmt.Sprintf("%s/inventory/reserve", strings.TrimRight(baseURL, "/")),
		"application/json",
		strings.NewReader(string(payload)),
	)
	if err != nil {
		return fmt.Errorf("failed to reserve inventory")
	}
	defer response.Body.Close()

	if response.StatusCode == http.StatusOK {
		return nil
	}

	body, _ := io.ReadAll(response.Body)
	message := strings.TrimSpace(string(body))
	if message == "" {
		message = "failed to reserve inventory"
	}

	var errorPayload map[string]interface{}
	if json.Unmarshal(body, &errorPayload) == nil {
		if errorText, ok := errorPayload["error"].(string); ok && errorText != "" {
			return fmt.Errorf(errorText)
		}
	}

	return fmt.Errorf(message)
}

func calculateDiscount(subtotal float64, code string) float64 {
	switch strings.ToUpper(strings.TrimSpace(code)) {
	case "SAVE10":
		return roundCurrency(subtotal * 0.10)
	case "FLOW20":
		return roundCurrency(subtotal * 0.20)
	case "NEWUSER15":
		return roundCurrency(subtotal * 0.15)
	default:
		return 0
	}
}

func roundCurrency(value float64) float64 {
	return math.Round(value*100) / 100
}

func cacheOrder(order *models.Order) {
	cacheKey := fmt.Sprintf("order:%d", order.ID)
	data, err := json.Marshal(order)
	if err == nil {
		if setErr := cache.Client.Set(cache.Ctx, cacheKey, data, 5*time.Minute).Err(); setErr != nil {
			log.Printf("[Order-Service] Failed to cache order #%d: %v", order.ID, setErr)
		}
	}
}
