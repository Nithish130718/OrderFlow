package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func Connect() {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		getEnv("DB_HOST", "localhost"),
		getEnv("DB_PORT", "5432"),
		getEnv("DB_USER", "postgres"),
		getEnv("DB_PASSWORD", "postgres"),
		getEnv("DB_NAME", "notifications_db"),
	)

	var err error
	DB, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("[Notification-Service] Failed to open DB connection: %v", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatalf("[Notification-Service] Failed to ping DB: %v", err)
	}

	log.Println("[Notification-Service] Connected to PostgreSQL successfully")
	migrate()
}

func migrate() {
	query := `
		CREATE TABLE IF NOT EXISTS notifications (
			id       SERIAL PRIMARY KEY,
			order_id INTEGER NOT NULL,
			type     VARCHAR(100) NOT NULL,
			status   VARCHAR(50) NOT NULL DEFAULT 'sent',
			sent_at  TIMESTAMP NOT NULL DEFAULT NOW()
		);
	`
	if _, err := DB.Exec(query); err != nil {
		log.Fatalf("[Notification-Service] Migration failed: %v", err)
	}
	log.Println("[Notification-Service] Database migration completed")
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
