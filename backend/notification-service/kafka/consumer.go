package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/smtp"
	"os"
	"strings"
	"time"

	"github.com/segmentio/kafka-go"

	"notification-service/db"
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
		MinBytes:       1,
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

	saveNotification(orderID, 0, "Email", "info", "Order Confirmation Sent",
		fmt.Sprintf("Order #%d confirmation has been queued for customer %d.", orderID, userID), "sent")
	saveNotification(orderID, 0, "System", "info", "New Order Received",
		fmt.Sprintf("Order #%d is now visible in the live dashboard and order queue.", orderID), "sent")
}

func handleInventoryUpdated(data []byte) {
	var event map[string]interface{}
	if err := json.Unmarshal(data, &event); err != nil {
		log.Printf("[Notification-Service] Failed to parse inventory.updated event: %v", err)
		return
	}

	orderID := int(getFloat(event, "order_id"))
	productID := int(getFloat(event, "product_id"))
	deducted := int(getFloat(event, "deducted"))
	newStock := int(getFloat(event, "new_stock"))
	productLabel, threshold := getProductDetails(productID)

	saveNotification(orderID, productID, "System", "info", "Inventory Updated",
		fmt.Sprintf("%s inventory adjusted after order #%d. Remaining stock: %d.", productLabel, orderID, newStock), "sent")

	if newStock <= 10 {
		severity := "warning"
		title := fmt.Sprintf("Low Stock Alert: %s", productLabel)
		message := formatStockAlertBody(productID, productLabel, deducted, newStock, threshold)
		if newStock <= 3 {
			severity = "critical"
			title = fmt.Sprintf("Critical Stock Alert: %s", productLabel)
		}

		saveNotification(orderID, productID, "System", severity, title, message, "sent")
		if severity == "critical" {
			sendCriticalEmails(title, message)
		}
	}
}

func getProductDetails(productID int) (string, int) {
	baseURL := os.Getenv("INVENTORY_SERVICE_URL")
	if baseURL == "" {
		baseURL = "http://inventory-service:8082"
	}

	response, err := http.Get(fmt.Sprintf("%s/inventory/%d", strings.TrimRight(baseURL, "/"), productID))
	if err != nil {
		return fmt.Sprintf("Product #%d", productID), 0
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		_, _ = io.ReadAll(response.Body)
		return fmt.Sprintf("Product #%d", productID), 0
	}

	var payload struct {
		Product struct {
			Name      string `json:"name"`
			SKU       string `json:"sku"`
			Threshold int    `json:"threshold"`
		} `json:"product"`
	}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		return fmt.Sprintf("Product #%d", productID), 0
	}

	if payload.Product.Name == "" {
		return fmt.Sprintf("Product #%d", productID), payload.Product.Threshold
	}

	if payload.Product.SKU != "" {
		return fmt.Sprintf("%s (%s)", payload.Product.Name, payload.Product.SKU), payload.Product.Threshold
	}

	return payload.Product.Name, payload.Product.Threshold
}

func formatStockAlertBody(productID int, productLabel string, deducted int, newStock int, threshold int) string {
	return fmt.Sprintf(
		"Product ID: %d\nProduct Name: %s\nLast Order Qty: %d\nCurrent Stock: %d\nThreshold: %d",
		productID,
		productLabel,
		deducted,
		newStock,
		threshold,
	)
}

func saveNotification(orderID, productID int, notifType, severity, title, message, status string) {
	_, err := db.DB.Exec(
		`INSERT INTO notifications (order_id, product_id, type, severity, title, message, status, read)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)`,
		orderID, productID, notifType, severity, title, message, status,
	)
	if err != nil {
		log.Printf("[Notification-Service] Failed to persist notification: %v", err)
	}
}

func sendCriticalEmails(subject, body string) {
	rows, err := db.DB.Query("SELECT email FROM emergency_contacts ORDER BY is_primary DESC, id ASC")
	if err != nil {
		log.Printf("[Notification-Service] Failed to load emergency contacts: %v", err)
		return
	}
	defer rows.Close()

	recipients := make([]string, 0)
	for rows.Next() {
		var email string
		if scanErr := rows.Scan(&email); scanErr == nil {
			recipients = append(recipients, email)
		}
	}
	if len(recipients) == 0 {
		return
	}

	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")
	from := os.Getenv("SMTP_FROM")
	if host == "" || port == "" || user == "" || pass == "" || from == "" {
		log.Printf("[Notification-Service] SMTP not configured. Critical alert intended for: %s", strings.Join(recipients, ", "))
		return
	}

	auth := smtp.PlainAuth("", user, pass, host)
	msg := []byte("To: " + strings.Join(recipients, ",") + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/plain; charset=\"utf-8\"\r\n\r\n" +
		body + "\r\n")

	if err := smtp.SendMail(host+":"+port, auth, from, recipients, msg); err != nil {
		log.Printf("[Notification-Service] Failed to send critical emails: %v", err)
		return
	}

	log.Printf("[Notification-Service] Critical alert emails sent to %s", strings.Join(recipients, ", "))
}

func getFloat(m map[string]interface{}, key string) float64 {
	if v, ok := m[key]; ok {
		if f, ok := v.(float64); ok {
			return f
		}
	}
	return 0
}
