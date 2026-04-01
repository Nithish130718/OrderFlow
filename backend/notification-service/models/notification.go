package models

import "time"

type Notification struct {
	ID        int       `json:"id" db:"id"`
	OrderID   int       `json:"order_id" db:"order_id"`
	Type      string    `json:"type" db:"type"`
	Status    string    `json:"status" db:"status"`
	SentAt    time.Time `json:"sent_at" db:"sent_at"`
}
