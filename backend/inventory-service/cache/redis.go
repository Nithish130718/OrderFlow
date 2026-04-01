package cache

import (
	"context"
	"log"
	"os"

	"github.com/redis/go-redis/v9"
)

var Client *redis.Client
var Ctx = context.Background()

func Connect() {
	addr := os.Getenv("REDIS_ADDR")
	if addr == "" {
		addr = "localhost:6379"
	}

	Client = redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
	})

	if err := Client.Ping(Ctx).Err(); err != nil {
		log.Fatalf("[Inventory-Service] Failed to connect to Redis: %v", err)
	}
	log.Println("[Inventory-Service] Connected to Redis successfully")
}
