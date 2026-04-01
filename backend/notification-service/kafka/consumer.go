package kafka

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/segmentio/kafka-go"

	"notification-service/db"
	"notification-service/models"
)

func StartConsumer() {
	broker := os.Getenv("KAFKA_BROKERS")
	if broker == "" {
		broker = "localhost:9092"
	}

	go consumeTopic(broker, "order.created", "notification-order-group", handleOrderCreated)
	go consumeTopic(broker, "inventory.updated", "notification-inventory-group", handleInventoryUpdated)
}

func consumeTopic(broker, topic, groupID string, handler func([]byte)) {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:        []string{broker},
		Topic:          topic,
		GroupID:        groupID,
		MinBytes:       10e3,
		MaxBytes:       10e6,
		CommitInterval: time.Second,
		StartOffset:    kafka.FirstOffset,
	})

	log.Printf("[Notification-Service] Consumer started for topic '%s' (group: %s)", topic, groupID)

	for {
		msg, err := reader.ReadMessage(context.Background())
		if err != nil {
			log.Printf("[Notification-Service] Error reading from topic '%s': %v", topic, err)
			continue
		}
		log.Printf("[Notification-Service] Received event from topic '%s': %s", topic, string(msg.Value))
		handler(msg.Value)
	}
}

func handleOrderCreated(data []byte) {
	var event map[string]interface{}
	if err := json.Unmarshal(data, &event); err != nil {
		log.Printf("[Notification-Service] Failed to parse order.created event: %v", err)
		return
	}

	orderID := int(getFloat(event, "order_id"))
	userID := int(getFloat(event, "user_id"))

	// Simulate email notification
	log.Printf("📧 [EMAIL] To: user_%d@example.com | Subject: Order #%d Confirmed | Your order has been received and is being processed.", userID, orderID)
	// Simulate SMS notification
	log.Printf("📱 [SMS] To: +1-555-0%d | Message: Order #%d placed successfully! We'll notify you when it ships.", userID, orderID)

	saveNotification(orderID, "order_confirmation", "sent")
}

func handleInventoryUpdated(data []byte) {
	var event map[string]interface{}
	if err := json.Unmarshal(data, &event); err != nil {
		log.Printf("[Notification-Service] Failed to parse inventory.updated event: %v", err)
		return
	}

	orderID := int(getFloat(event, "order_id"))
	productID := int(getFloat(event, "product_id"))
	newStock := int(getFloat(event, "new_stock"))

	log.Printf("📦 [INVENTORY] Order #%d: Product %d stock updated. Remaining stock: %d", orderID, productID, newStock)

	if newStock < 20 {
		log.Printf("⚠️  [ALERT] Low stock warning! Product %d has only %d units remaining.", productID, newStock)
		saveNotification(orderID, "low_stock_alert", "sent")
	}

	saveNotification(orderID, "inventory_update", "sent")
}

func saveNotification(orderID int, notifType, status string) {
	n := models.Notification{
		OrderID: orderID,
		Type:    notifType,
		Status:  status,
	}

	_, err := db.DB.Exec(
		"INSERT INTO notifications (order_id, type, status) VALUES ($1, $2, $3)",
		n.OrderID, n.Type, n.Status,
	)
	if err != nil {
		log.Printf("[Notification-Service] Failed to persist notification (order: %d, type: %s): %v",
			orderID, notifType, err)
		return
	}
	log.Printf("[Notification-Service] Notification logged to DB — order: %d, type: %s, status: %s",
		orderID, notifType, status)
}

func getFloat(m map[string]interface{}, key string) float64 {
	if v, ok := m[key]; ok {
		if f, ok := v.(float64); ok {
			return f
		}
	}
	return 0
}
