package models

import "time"

type Inventory struct {
	ProductID     int `json:"product_id" db:"product_id"`
	StockQuantity int `json:"stock_quantity" db:"stock_quantity"`
}

// InventoryInput is parsed from the order.created Kafka event
type InventoryInput struct {
	OrderID   int `json:"order_id"`
	ProductID int `json:"product_id"`
	Quantity  int `json:"quantity"`
}

type InventoryUpdatedEvent struct {
	ProductID int       `json:"product_id"`
	OrderID   int       `json:"order_id"`
	Deducted  int       `json:"deducted"`
	NewStock  int       `json:"new_stock"`
	UpdatedAt time.Time `json:"updated_at"`
}
