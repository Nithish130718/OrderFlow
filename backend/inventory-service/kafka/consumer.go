package kafka

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/segmentio/kafka-go"

	"inventory-service/db"
	"inventory-service/models"
)

func StartConsumer(publishFn func(topic string, payload interface{}) error) {
	broker := os.Getenv("KAFKA_BROKERS")
	if broker == "" {
		broker = "localhost:9092"
	}

	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:        []string{broker},
		Topic:          "order.created",
		GroupID:        "inventory-service-group",
		MinBytes:       10e3,
		MaxBytes:       10e6,
		CommitInterval: time.Second,
		StartOffset:    kafka.FirstOffset,
	})

	log.Println("[Inventory-Service] Kafka consumer started, listening on topic 'order.created'")

	for {
		msg, err := reader.ReadMessage(context.Background())
		if err != nil {
			log.Printf("[Inventory-Service] Error reading message: %v", err)
			continue
		}

		log.Printf("[Inventory-Service] Received event from topic '%s': %s", msg.Topic, string(msg.Value))
		handleOrderCreated(msg.Value, publishFn)
	}
}

func handleOrderCreated(data []byte, publishFn func(topic string, payload interface{}) error) {
	var event models.InventoryInput
	if err := json.Unmarshal(data, &event); err != nil {
		log.Printf("[Inventory-Service] Failed to parse order.created event: %v", err)
		return
	}

	var currentStock int
	err := db.DB.QueryRow(
		"SELECT stock_quantity FROM inventory WHERE product_id = $1",
		event.ProductID,
	).Scan(&currentStock)
	if err != nil {
		log.Printf("[Inventory-Service] Product %d not found in inventory: %v", event.ProductID, err)
		return
	}

	if currentStock < event.Quantity {
		log.Printf("[Inventory-Service] Insufficient stock for product %d: have %d, need %d",
			event.ProductID, currentStock, event.Quantity)
		return
	}

	var newStock int
	err = db.DB.QueryRow(
		"UPDATE inventory SET stock_quantity = stock_quantity - $1 WHERE product_id = $2 RETURNING stock_quantity",
		event.Quantity, event.ProductID,
	).Scan(&newStock)
	if err != nil {
		log.Printf("[Inventory-Service] Failed to update inventory for product %d: %v", event.ProductID, err)
		return
	}

	log.Printf("[Inventory-Service] Stock updated — product %d: %d -> %d (deducted %d)",
		event.ProductID, currentStock, newStock, event.Quantity)

	updatedEvent := models.InventoryUpdatedEvent{
		ProductID: event.ProductID,
		OrderID:   event.OrderID,
		Deducted:  event.Quantity,
		NewStock:  newStock,
		UpdatedAt: time.Now(),
	}

	if err := publishFn("inventory.updated", updatedEvent); err != nil {
		log.Printf("[Inventory-Service] Failed to publish inventory.updated event: %v", err)
	}
}
