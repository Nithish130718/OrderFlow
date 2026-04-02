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
		CREATE TABLE IF NOT EXISTS admin_profiles (
			id      INTEGER PRIMARY KEY,
			name    VARCHAR(120) NOT NULL,
			email   VARCHAR(180) NOT NULL,
			role    VARCHAR(120) NOT NULL
		);

		CREATE TABLE IF NOT EXISTS emergency_contacts (
			id          SERIAL PRIMARY KEY,
			profile_id  INTEGER NOT NULL REFERENCES admin_profiles(id) ON DELETE CASCADE,
			email       VARCHAR(180) NOT NULL UNIQUE,
			is_primary  BOOLEAN NOT NULL DEFAULT FALSE
		);

		CREATE TABLE IF NOT EXISTS notifications (
			id         SERIAL PRIMARY KEY,
			order_id   INTEGER NOT NULL DEFAULT 0,
			product_id INTEGER NOT NULL DEFAULT 0,
			type       VARCHAR(100) NOT NULL,
			severity   VARCHAR(50) NOT NULL DEFAULT 'info',
			title      VARCHAR(180) NOT NULL,
			message    TEXT NOT NULL,
			status     VARCHAR(50) NOT NULL DEFAULT 'sent',
			read       BOOLEAN NOT NULL DEFAULT FALSE,
			sent_at    TIMESTAMP NOT NULL DEFAULT NOW()
		);
	`
	if _, err := DB.Exec(query); err != nil {
		log.Fatalf("[Notification-Service] Migration failed: %v", err)
	}

	compatibility := []string{
		`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS product_id INTEGER NOT NULL DEFAULT 0;`,
		`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS severity VARCHAR(50) NOT NULL DEFAULT 'info';`,
		`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(180) NOT NULL DEFAULT 'Notification';`,
		`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '';`,
		`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT FALSE;`,
		`UPDATE notifications
		 SET
			title = CASE
				WHEN title = '' OR title = 'Notification' THEN INITCAP(REPLACE(type, '_', ' '))
				ELSE title
			END,
			message = CASE
				WHEN message = '' THEN 'Imported legacy notification record.'
				ELSE message
			END,
			severity = CASE
				WHEN severity = '' THEN 'info'
				ELSE severity
			END;`,
	}
	for _, statement := range compatibility {
		if _, err := DB.Exec(statement); err != nil {
			log.Fatalf("[Notification-Service] Compatibility migration failed: %v", err)
		}
	}

	seed()
	log.Println("[Notification-Service] Database migration completed")
}

func seed() {
	statements := []string{
		`INSERT INTO admin_profiles (id, name, email, role)
		 VALUES (1, 'Admin', 'admin@orderflow.io', 'System Operator')
		 ON CONFLICT (id) DO NOTHING;`,
		`INSERT INTO emergency_contacts (profile_id, email, is_primary)
		 SELECT 1, 'alerts@orderflow.io', TRUE
		 WHERE NOT EXISTS (SELECT 1 FROM emergency_contacts LIMIT 1);`,
		`INSERT INTO notifications (order_id, product_id, type, severity, title, message, status, read, sent_at)
		SELECT * FROM (VALUES
			(5, 2, 'Email', 'info', 'Order Confirmation Sent', 'Order #5 confirmation email was delivered successfully.', 'sent', TRUE, NOW() - INTERVAL '8 hours'),
			(4, 0, 'System', 'info', 'New Order Received', 'Order #4 was placed and is waiting for packing.', 'sent', FALSE, NOW() - INTERVAL '6 hours'),
			(0, 3, 'System', 'warning', 'Low Stock Alert', 'Smart Fitness Watch inventory is below threshold with 12 units left.', 'sent', FALSE, NOW() - INTERVAL '3 hours'),
			(0, 5, 'System', 'critical', 'Critical Stockout Risk', 'Noise Cancelling Buds are close to stockout and may require urgent replenishment.', 'sent', FALSE, NOW() - INTERVAL '90 minutes')
		) AS seed_rows (order_id, product_id, type, severity, title, message, status, read, sent_at)
		WHERE NOT EXISTS (SELECT 1 FROM notifications LIMIT 1);`,
	}

	for _, statement := range statements {
		if _, err := DB.Exec(statement); err != nil {
			log.Fatalf("[Notification-Service] Seed failed: %v", err)
		}
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
