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
		getEnv("DB_NAME", "inventory_db"),
	)

	var err error
	DB, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("[Inventory-Service] Failed to open DB connection: %v", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatalf("[Inventory-Service] Failed to ping DB: %v", err)
	}

	log.Println("[Inventory-Service] Connected to PostgreSQL successfully")
	migrate()
}

func migrate() {
	query := `
		CREATE TABLE IF NOT EXISTS inventory (
			product_id     INTEGER PRIMARY KEY,
			stock_quantity INTEGER NOT NULL DEFAULT 0
		);

		INSERT INTO inventory (product_id, stock_quantity)
		VALUES (1, 100), (2, 200), (3, 150), (4, 75), (5, 300)
		ON CONFLICT (product_id) DO NOTHING;
	`
	if _, err := DB.Exec(query); err != nil {
		log.Fatalf("[Inventory-Service] Migration failed: %v", err)
	}
	log.Println("[Inventory-Service] Database migration completed with seed data")
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
