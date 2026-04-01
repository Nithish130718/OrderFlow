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
		CREATE TABLE IF NOT EXISTS products (
			id            SERIAL PRIMARY KEY,
			name          VARCHAR(160) NOT NULL,
			sku           VARCHAR(80) UNIQUE NOT NULL,
			category      VARCHAR(80) NOT NULL,
			description   TEXT NOT NULL DEFAULT '',
			image         VARCHAR(24) NOT NULL DEFAULT '',
			price         NUMERIC(10,2) NOT NULL,
			stock_quantity INTEGER NOT NULL DEFAULT 0,
			threshold     INTEGER NOT NULL DEFAULT 10,
			updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
		);
	`
	if _, err := DB.Exec(query); err != nil {
		log.Fatalf("[Inventory-Service] Migration failed: %v", err)
	}

	seed()
	log.Println("[Inventory-Service] Database migration completed with seed data")
}

func seed() {
	statement := `
		INSERT INTO products (id, name, sku, category, description, image, price, stock_quantity, threshold, updated_at)
		SELECT * FROM (VALUES
			(1, 'Wireless Headphones Pro', 'WHP-100', 'Electronics', 'Noise-isolating over-ear headphones for premium everyday listening.', 'HP', 149.99, 234, 20, NOW() - INTERVAL '1 day'),
			(2, 'Ergonomic Keyboard', 'EKB-200', 'Electronics', 'Low-profile split keyboard designed for long order-entry sessions.', 'KB', 89.99, 156, 25, NOW() - INTERVAL '6 hours'),
			(3, 'Smart Fitness Watch', 'SFW-300', 'Wearables', 'Compact wearable with health telemetry and NFC checkout support.', 'SW', 199.99, 12, 15, NOW() - INTERVAL '3 hours'),
			(4, 'USB-C Hub 7-in-1', 'UCH-400', 'Accessories', 'Multi-port docking hub with HDMI, USB-A and SD expansion.', 'HB', 49.99, 389, 30, NOW() - INTERVAL '9 hours'),
			(5, 'Noise Cancelling Buds', 'NCB-500', 'Electronics', 'Pocket-sized ANC earbuds built for quick fulfillment demos.', 'NB', 79.99, 8, 12, NOW() - INTERVAL '4 hours'),
			(6, 'Portable SSD 1TB', 'PSD-600', 'Storage', 'Fast 1TB SSD for catalog backups and media shipping kits.', 'SD', 119.99, 67, 18, NOW() - INTERVAL '2 hours'),
			(7, 'Bluetooth Speaker', 'BTS-010', 'Electronics', 'Portable speaker with wide stereo sound and rugged shell.', 'SP', 69.99, 92, 16, NOW() - INTERVAL '30 minutes')
		) AS seed_rows (id, name, sku, category, description, image, price, stock_quantity, threshold, updated_at)
		WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

		SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1), true);
	`
	if _, err := DB.Exec(statement); err != nil {
		log.Fatalf("[Inventory-Service] Seed failed: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
