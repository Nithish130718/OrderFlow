package kafka

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/segmentio/kafka-go"
)

var writer *kafka.Writer

func InitProducer() {
	broker := os.Getenv("KAFKA_BROKERS")
	if broker == "" {
		broker = "localhost:9092"
	}

	writer = &kafka.Writer{
		Addr:         kafka.TCP(broker),
		Balancer:     &kafka.LeastBytes{},
		WriteTimeout: 10 * time.Second,
		ReadTimeout:  10 * time.Second,
	}
	log.Println("[Order-Service] Kafka producer initialized")
}

func PublishEvent(topic string, payload interface{}) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	msg := kafka.Message{
		Topic: topic,
		Key:   []byte(time.Now().String()),
		Value: data,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := writer.WriteMessages(ctx, msg); err != nil {
		log.Printf("[Order-Service] Failed to publish to topic %s: %v", topic, err)
		return err
	}

	log.Printf("[Order-Service] Published event to topic '%s': %s", topic, string(data))
	return nil
}

func Close() {
	if writer != nil {
		writer.Close()
	}
}
