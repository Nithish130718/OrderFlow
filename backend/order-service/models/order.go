package models

import "time"

type Customer struct {
	ID     int    `json:"id" db:"id"`
	Name   string `json:"name" db:"name"`
	Email  string `json:"email" db:"email"`
	Avatar string `json:"avatar" db:"avatar"`
}

type ProductSnapshot struct {
	ID       int     `json:"id" db:"id"`
	Name     string  `json:"name" db:"name"`
	SKU      string  `json:"sku" db:"sku"`
	Category string  `json:"category" db:"category"`
	Image    string  `json:"image" db:"image"`
	Price    float64 `json:"price" db:"price"`
}

type Order struct {
	ID             int             `json:"id" db:"id"`
	CustomerID     int             `json:"customer_id" db:"customer_id"`
	ProductID      int             `json:"product_id" db:"product_id"`
	Quantity       int             `json:"quantity" db:"quantity"`
	Status         string          `json:"status" db:"status"`
	PaymentMethod  string          `json:"payment_method" db:"payment_method"`
	DiscountCode   string          `json:"discount_code" db:"discount_code"`
	DiscountAmount float64         `json:"discount_amount" db:"discount_amount"`
	Subtotal       float64         `json:"subtotal" db:"subtotal"`
	Total          float64         `json:"total" db:"total"`
	CreatedAt      time.Time       `json:"created_at" db:"created_at"`
	Customer       Customer        `json:"customer"`
	Product        ProductSnapshot `json:"product"`
}

type CreateOrderRequest struct {
	CustomerID    int    `json:"customer_id" binding:"required"`
	ProductID     int    `json:"product_id" binding:"required"`
	Quantity      int    `json:"quantity" binding:"required,min=1"`
	DiscountCode  string `json:"discount_code"`
	PaymentMethod string `json:"payment_method" binding:"required"`
}

type OrderEvent struct {
	OrderID   int    `json:"order_id"`
	UserID    int    `json:"user_id"`
	ProductID int    `json:"product_id"`
	Quantity  int    `json:"quantity"`
	Status    string `json:"status"`
}
