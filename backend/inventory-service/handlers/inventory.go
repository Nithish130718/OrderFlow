package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"inventory-service/cache"
	"inventory-service/db"
	"inventory-service/kafka"
	"inventory-service/models"
)

func GetInventory(c *gin.Context) {
	productID, err := strconv.Atoi(c.Param("product_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	cacheKey := fmt.Sprintf("inventory:%d", productID)
	cached, err := cache.Client.Get(cache.Ctx, cacheKey).Result()
	if err == nil {
		var product models.Product
		if jsonErr := json.Unmarshal([]byte(cached), &product); jsonErr == nil {
			c.JSON(http.StatusOK, gin.H{"product": product, "source": "cache"})
			return
		}
	}

	product, err := fetchProduct(productID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Product #%d not found", productID)})
		return
	}

	cacheProduct(product)
	c.JSON(http.StatusOK, gin.H{"product": product, "source": "database"})
}

func ListInventory(c *gin.Context) {
	rows, err := db.DB.Query(`
		SELECT id, name, sku, category, description, image, price, stock_quantity, threshold, updated_at
		FROM products
		ORDER BY name
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch inventory"})
		return
	}
	defer rows.Close()

	items := make([]models.Product, 0)
	for rows.Next() {
		var product models.Product
		if scanErr := rows.Scan(
			&product.ID,
			&product.Name,
			&product.SKU,
			&product.Category,
			&product.Description,
			&product.Image,
			&product.Price,
			&product.Stock,
			&product.Threshold,
			&product.UpdatedAt,
		); scanErr == nil {
			items = append(items, product)
		}
	}

	c.JSON(http.StatusOK, gin.H{"products": items, "count": len(items)})
}

func CreateProduct(c *gin.Context) {
	var req models.ProductInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	var product models.Product
	err := db.DB.QueryRow(`
		INSERT INTO products (name, sku, category, description, image, price, stock_quantity, threshold, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
		RETURNING id, name, sku, category, description, image, price, stock_quantity, threshold, updated_at
	`,
		req.Name,
		req.SKU,
		req.Category,
		req.Description,
		req.Image,
		req.Price,
		req.Stock,
		max(req.Threshold, 0),
	).Scan(
		&product.ID,
		&product.Name,
		&product.SKU,
		&product.Category,
		&product.Description,
		&product.Image,
		&product.Price,
		&product.Stock,
		&product.Threshold,
		&product.UpdatedAt,
	)
	if err != nil {
		log.Printf("[Inventory-Service] Failed to create product: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}

	cacheProduct(product)
	c.JSON(http.StatusCreated, gin.H{"product": product})
}

func ReserveInventory(c *gin.Context) {
	var req struct {
		OrderID   int `json:"order_id" binding:"required"`
		ProductID int `json:"product_id" binding:"required"`
		Quantity  int `json:"quantity" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	var currentStock int
	err := db.DB.QueryRow("SELECT stock_quantity FROM products WHERE id = $1", req.ProductID).Scan(&currentStock)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found in inventory"})
		return
	}

	if currentStock < req.Quantity {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient stock"})
		return
	}

	var product models.Product
	err = db.DB.QueryRow(`
		UPDATE products
		SET stock_quantity = stock_quantity - $1, updated_at = NOW()
		WHERE id = $2
		RETURNING id, name, sku, category, description, image, price, stock_quantity, threshold, updated_at
	`, req.Quantity, req.ProductID).Scan(
		&product.ID,
		&product.Name,
		&product.SKU,
		&product.Category,
		&product.Description,
		&product.Image,
		&product.Price,
		&product.Stock,
		&product.Threshold,
		&product.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reserve inventory"})
		return
	}

	cacheProduct(product)

	updatedEvent := models.InventoryUpdatedEvent{
		ProductID: req.ProductID,
		OrderID:   req.OrderID,
		Deducted:  req.Quantity,
		NewStock:  product.Stock,
		UpdatedAt: product.UpdatedAt,
	}
	if err := kafka.PublishEvent("inventory.updated", updatedEvent); err != nil {
		log.Printf("[Inventory-Service] Failed to publish inventory.updated event: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{"product": product})
}

func UpdateProductStock(c *gin.Context) {
	productID, err := strconv.Atoi(c.Param("product_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req struct {
		Stock int `json:"stock" binding:"min=0"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	var product models.Product
	err = db.DB.QueryRow(`
		UPDATE products
		SET stock_quantity = $1, updated_at = NOW()
		WHERE id = $2
		RETURNING id, name, sku, category, description, image, price, stock_quantity, threshold, updated_at
	`, req.Stock, productID).Scan(
		&product.ID,
		&product.Name,
		&product.SKU,
		&product.Category,
		&product.Description,
		&product.Image,
		&product.Price,
		&product.Stock,
		&product.Threshold,
		&product.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update stock"})
		return
	}

	cacheProduct(product)
	c.JSON(http.StatusOK, gin.H{"product": product})
}

func DeleteProduct(c *gin.Context) {
	productID, err := strconv.Atoi(c.Param("product_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	result, err := db.DB.Exec("DELETE FROM products WHERE id = $1", productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	cache.Client.Del(cache.Ctx, fmt.Sprintf("inventory:%d", productID))
	c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}

func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"service": "inventory-service",
		"status":  "healthy",
		"time":    time.Now(),
	})
}

func fetchProduct(id int) (models.Product, error) {
	var product models.Product
	err := db.DB.QueryRow(`
		SELECT id, name, sku, category, description, image, price, stock_quantity, threshold, updated_at
		FROM products
		WHERE id = $1
	`, id).Scan(
		&product.ID,
		&product.Name,
		&product.SKU,
		&product.Category,
		&product.Description,
		&product.Image,
		&product.Price,
		&product.Stock,
		&product.Threshold,
		&product.UpdatedAt,
	)
	return product, err
}

func cacheProduct(product models.Product) {
	cacheKey := fmt.Sprintf("inventory:%d", product.ID)
	data, _ := json.Marshal(product)
	if setErr := cache.Client.Set(cache.Ctx, cacheKey, data, 2*time.Minute).Err(); setErr != nil {
		log.Printf("[Inventory-Service] Failed to cache product %d: %v", product.ID, setErr)
	}
}

func max(value, minimum int) int {
	if value < minimum {
		return minimum
	}
	return value
}
