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
		getEnv("DB_NAME", "orders_db"),
	)

	var err error
	DB, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("[Order-Service] Failed to open DB connection: %v", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatalf("[Order-Service] Failed to ping DB: %v", err)
	}

	log.Println("[Order-Service] Connected to PostgreSQL successfully")
	migrate()
}

func migrate() {
	query := `
		CREATE TABLE IF NOT EXISTS customers (
			id         INTEGER PRIMARY KEY,
			name       VARCHAR(120) NOT NULL,
			email      VARCHAR(180) NOT NULL,
			avatar     VARCHAR(8) NOT NULL
		);

		CREATE TABLE IF NOT EXISTS product_snapshots (
			id         INTEGER PRIMARY KEY,
			name       VARCHAR(160) NOT NULL,
			sku        VARCHAR(80) NOT NULL,
			category   VARCHAR(80) NOT NULL,
			image      VARCHAR(24) NOT NULL,
			price      NUMERIC(10,2) NOT NULL
		);

		CREATE TABLE IF NOT EXISTS orders (
			id              SERIAL PRIMARY KEY,
			customer_id     INTEGER NOT NULL REFERENCES customers(id),
			product_id      INTEGER NOT NULL REFERENCES product_snapshots(id),
			quantity        INTEGER NOT NULL,
			status          VARCHAR(50) NOT NULL DEFAULT 'Placed',
			payment_method  VARCHAR(50) NOT NULL,
			discount_code   VARCHAR(40) NOT NULL DEFAULT '',
			discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
			subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
			total           NUMERIC(10,2) NOT NULL DEFAULT 0,
			created_at      TIMESTAMP NOT NULL DEFAULT NOW()
		);
	`
	if _, err := DB.Exec(query); err != nil {
		log.Fatalf("[Order-Service] Migration failed: %v", err)
	}

	seed()
	log.Println("[Order-Service] Database migration completed")
}

func seed() {
	statements := []string{
		`INSERT INTO customers (id, name, email, avatar) VALUES
			(1, 'Alex Rivera', 'alex@orderflow.io', 'AR'),
			(2, 'Priya Sharma', 'priya@orderflow.io', 'PS'),
			(3, 'Marcus Chen', 'marcus@orderflow.io', 'MC'),
			(4, 'Sofia Gomez', 'sofia@orderflow.io', 'SG'),
			(5, 'Jordan Lee', 'jordan@orderflow.io', 'JL')
		ON CONFLICT (id) DO NOTHING;`,
		`INSERT INTO product_snapshots (id, name, sku, category, image, price) VALUES
			(1, 'Wireless Headphones Pro', 'WHP-100', 'Electronics', 'HP', 149.99),
			(2, 'Ergonomic Keyboard', 'EKB-200', 'Electronics', 'KB', 89.99),
			(3, 'Smart Fitness Watch', 'SFW-300', 'Wearables', 'SW', 199.99),
			(4, 'USB-C Hub 7-in-1', 'UCH-400', 'Accessories', 'HB', 49.99),
			(5, 'Portable SSD 1TB', 'PSD-600', 'Storage', 'SD', 119.99),
			(6, 'Bluetooth Speaker', 'BTS-010', 'Electronics', 'SP', 69.99)
		ON CONFLICT (id) DO NOTHING;`,
		`INSERT INTO orders (customer_id, product_id, quantity, status, payment_method, discount_code, discount_amount, subtotal, total, created_at)
		SELECT * FROM (VALUES
			(1, 1, 1, 'Delivered', 'Credit Card', 'SAVE10', 15.00, 149.99, 134.99, NOW() - INTERVAL '3 days'),
			(2, 3, 1, 'Shipped', 'UPI', '', 0.00, 199.99, 199.99, NOW() - INTERVAL '2 days'),
			(4, 4, 2, 'Placed', 'PayPal', '', 0.00, 99.98, 99.98, NOW() - INTERVAL '12 hours'),
			(3, 5, 1, 'Processing', 'Debit Card', 'FLOW20', 24.00, 119.99, 95.99, NOW() - INTERVAL '6 hours'),
			(5, 2, 3, 'Delivered', 'Credit Card', '', 0.00, 269.97, 269.97, NOW() - INTERVAL '2 hours')
		) AS seed_rows (customer_id, product_id, quantity, status, payment_method, discount_code, discount_amount, subtotal, total, created_at)
		WHERE NOT EXISTS (SELECT 1 FROM orders LIMIT 1);`,
	}

	for _, statement := range statements {
		if _, err := DB.Exec(statement); err != nil {
			log.Fatalf("[Order-Service] Seed failed: %v", err)
		}
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
