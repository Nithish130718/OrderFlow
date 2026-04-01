package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"inventory-service/cache"
	"inventory-service/db"
	"inventory-service/handlers"
	"inventory-service/kafka"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("[Inventory-Service] No .env file found, using environment variables")
	}

	// Init dependencies
	db.Connect()
	cache.Connect()
	kafka.InitProducer()
	defer kafka.Close()

	// Start Kafka consumer in background
	go kafka.StartConsumer(kafka.PublishEvent)

	// Set Gin mode
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Routes
	r.GET("/health", handlers.HealthCheck)
	r.GET("/inventory", handlers.ListInventory)
	r.GET("/inventory/:product_id", handlers.GetInventory)
	r.POST("/inventory", handlers.CreateProduct)
	r.DELETE("/inventory/:product_id", handlers.DeleteProduct)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}

	log.Printf("[Inventory-Service] Starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("[Inventory-Service] Failed to start server: %v", err)
	}
}
