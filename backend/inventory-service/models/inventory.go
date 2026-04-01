package models

import "time"

type Product struct {
	ID          int       `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	SKU         string    `json:"sku" db:"sku"`
	Category    string    `json:"category" db:"category"`
	Description string    `json:"description" db:"description"`
	Image       string    `json:"image" db:"image"`
	Price       float64   `json:"price" db:"price"`
	Stock       int       `json:"stock" db:"stock_quantity"`
	Threshold   int       `json:"threshold" db:"threshold"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type ProductInput struct {
	Name        string  `json:"name" binding:"required"`
	SKU         string  `json:"sku" binding:"required"`
	Category    string  `json:"category" binding:"required"`
	Description string  `json:"description"`
	Image       string  `json:"image"`
	Price       float64 `json:"price" binding:"required"`
	Stock       int     `json:"stock" binding:"required,min=0"`
	Threshold   int     `json:"threshold"`
}

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
