package models

import "time"

type Notification struct {
	ID        int       `json:"id"`
	OrderID   int       `json:"order_id"`
	ProductID int       `json:"product_id"`
	Type      string    `json:"type"`
	Severity  string    `json:"severity"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	Status    string    `json:"status"`
	Read      bool      `json:"read"`
	SentAt    time.Time `json:"sent_at"`
}

type EmergencyContact struct {
	ID        int    `json:"id"`
	Email     string `json:"email"`
	IsPrimary bool   `json:"is_primary"`
}

type AdminProfile struct {
	ID                int                `json:"id"`
	Name              string             `json:"name"`
	Email             string             `json:"email"`
	Role              string             `json:"role"`
	EmergencyContacts []EmergencyContact `json:"emergency_contacts"`
}
