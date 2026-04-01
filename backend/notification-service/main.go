package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"

	"notification-service/db"
	"notification-service/kafka"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("[Notification-Service] No .env file found, using environment variables")
	}

	// Init DB
	db.Connect()

	// Start Kafka consumers for both topics (each in its own goroutine)
	kafka.StartConsumer()

	// Minimal HTTP server for health checks
	port := os.Getenv("PORT")
	if port == "" {
		port = "8083"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"service":"notification-service","status":"healthy","time":"` + time.Now().Format(time.RFC3339) + `"}`))
	})

	log.Printf("[Notification-Service] Starting on port %s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("[Notification-Service] Failed to start server: %v", err)
	}
}
