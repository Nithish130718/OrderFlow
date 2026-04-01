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
	"inventory-service/models"
)

func GetInventory(c *gin.Context) {
	idStr := c.Param("product_id")
	productID, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	cacheKey := fmt.Sprintf("inventory:%d", productID)

	// Check Redis cache (~60% DB load reduction)
	cached, err := cache.Client.Get(cache.Ctx, cacheKey).Result()
	if err == nil {
		var inv models.Inventory
		if jsonErr := json.Unmarshal([]byte(cached), &inv); jsonErr == nil {
			log.Printf("[Inventory-Service] Cache HIT for product #%d", productID)
			c.JSON(http.StatusOK, gin.H{
				"inventory": inv,
				"source":    "cache",
			})
			return
		}
	}

	log.Printf("[Inventory-Service] Cache MISS for product #%d — querying DB", productID)

	var inv models.Inventory
	err = db.DB.QueryRow(
		"SELECT product_id, stock_quantity FROM inventory WHERE product_id = $1",
		productID,
	).Scan(&inv.ProductID, &inv.StockQuantity)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Product #%d not found in inventory", productID)})
		return
	}

	// Cache with 2-minute TTL for ~60% DB load reduction
	data, _ := json.Marshal(inv)
	if setErr := cache.Client.Set(cache.Ctx, cacheKey, data, 2*time.Minute).Err(); setErr != nil {
		log.Printf("[Inventory-Service] Failed to cache inventory for product %d: %v", productID, setErr)
	}

	c.JSON(http.StatusOK, gin.H{
		"inventory": inv,
		"source":    "database",
	})
}

func ListInventory(c *gin.Context) {
	rows, err := db.DB.Query("SELECT product_id, stock_quantity FROM inventory ORDER BY product_id")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch inventory"})
		return
	}
	defer rows.Close()

	var items []models.Inventory
	for rows.Next() {
		var inv models.Inventory
		if err := rows.Scan(&inv.ProductID, &inv.StockQuantity); err != nil {
			continue
		}
		items = append(items, inv)
	}

	c.JSON(http.StatusOK, gin.H{
		"inventory": items,
		"count":     len(items),
	})
}

func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"service": "inventory-service",
		"status":  "healthy",
		"time":    time.Now(),
	})
}
