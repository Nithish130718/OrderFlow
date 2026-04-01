package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"order-service/cache"
	"order-service/db"
	"order-service/handlers"
	"order-service/kafka"
)

func main() {
	// Load .env if present (ignored in Docker where env vars are injected)
	if err := godotenv.Load(); err != nil {
		log.Println("[Order-Service] No .env file found, using environment variables")
	}

	// Init dependencies
	db.Connect()
	cache.Connect()
	kafka.InitProducer()
	defer kafka.Close()

	// Set Gin mode
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Routes
	r.GET("/health", handlers.HealthCheck)
	r.POST("/orders", handlers.CreateOrder)
	r.GET("/orders", handlers.ListOrders)
	r.GET("/orders/:id", handlers.GetOrder)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	log.Printf("[Order-Service] Starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("[Order-Service] Failed to start server: %v", err)
	}
}
