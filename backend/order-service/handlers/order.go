package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
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

	var order models.Order
	err := db.DB.QueryRow(
		`INSERT INTO orders (user_id, product_id, quantity, status)
		 VALUES ($1, $2, $3, 'pending')
		 RETURNING id, user_id, product_id, quantity, status, created_at`,
		req.UserID, req.ProductID, req.Quantity,
	).Scan(&order.ID, &order.UserID, &order.ProductID, &order.Quantity, &order.Status, &order.CreatedAt)

	if err != nil {
		log.Printf("[Order-Service] Failed to create order: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	log.Printf("[Order-Service] Order #%d created for user %d", order.ID, order.UserID)

	// Publish to Kafka
	event := models.OrderEvent{
		OrderID:   order.ID,
		UserID:    order.UserID,
		ProductID: order.ProductID,
		Quantity:  order.Quantity,
		Status:    order.Status,
	}
	if err := kafka.PublishEvent("order.created", event); err != nil {
		log.Printf("[Order-Service] Warning: Failed to publish Kafka event for order %d: %v", order.ID, err)
	}

	// Cache the new order
	cacheOrder(&order)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Order created successfully",
		"order":   order,
	})
}

func GetOrder(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	cacheKey := fmt.Sprintf("order:%d", id)

	// Try Redis cache first
	cached, err := cache.Client.Get(cache.Ctx, cacheKey).Result()
	if err == nil {
		var order models.Order
		if jsonErr := json.Unmarshal([]byte(cached), &order); jsonErr == nil {
			log.Printf("[Order-Service] Cache HIT for order #%d", id)
			c.JSON(http.StatusOK, gin.H{
				"order":  order,
				"source": "cache",
			})
			return
		}
	}

	log.Printf("[Order-Service] Cache MISS for order #%d — querying DB", id)

	// Fall back to DB
	var order models.Order
	err = db.DB.QueryRow(
		"SELECT id, user_id, product_id, quantity, status, created_at FROM orders WHERE id = $1",
		id,
	).Scan(&order.ID, &order.UserID, &order.ProductID, &order.Quantity, &order.Status, &order.CreatedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Order #%d not found", id)})
		return
	}

	cacheOrder(&order)

	c.JSON(http.StatusOK, gin.H{
		"order":  order,
		"source": "database",
	})
}

func ListOrders(c *gin.Context) {
	rows, err := db.DB.Query(
		"SELECT id, user_id, product_id, quantity, status, created_at FROM orders ORDER BY created_at DESC LIMIT 50",
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var o models.Order
		if err := rows.Scan(&o.ID, &o.UserID, &o.ProductID, &o.Quantity, &o.Status, &o.CreatedAt); err != nil {
			continue
		}
		orders = append(orders, o)
	}

	c.JSON(http.StatusOK, gin.H{
		"orders": orders,
		"count":  len(orders),
	})
}

func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"service": "order-service",
		"status":  "healthy",
		"time":    time.Now(),
	})
}

func cacheOrder(order *models.Order) {
	cacheKey := fmt.Sprintf("order:%d", order.ID)
	data, err := json.Marshal(order)
	if err == nil {
		if setErr := cache.Client.Set(cache.Ctx, cacheKey, data, 5*time.Minute).Err(); setErr != nil {
			log.Printf("[Order-Service] Failed to cache order #%d: %v", order.ID, setErr)
		} else {
			log.Printf("[Order-Service] Cached order #%d (TTL: 5m)", order.ID)
		}
	}
}
