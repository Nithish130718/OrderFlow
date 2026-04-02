# OrderFlow

OrderFlow is a full-stack distributed order and inventory management system with a React frontend and a Go microservices backend. It supports live order placement, inventory updates, notification history, emergency alert emails, and a database-backed dashboard.

## Highlights

- React + Vite frontend with live data across dashboard, orders, inventory, notifications, and profile
- Go microservices for orders, inventory, and notifications
- PostgreSQL-backed persistence with initial seed data on first run
- Redis caching for frequently accessed order and inventory records
- Kafka event flow for downstream notification processing
- SMTP support for critical stock alert emails

## Project Structure

```text
OrderFlow/
|-- src/                           React frontend
|   |-- components/
|   |-- context/
|   |-- lib/
|   `-- pages/
|-- backend/
|   |-- order-service/
|   |-- inventory-service/
|   |-- notification-service/
|   |-- docker-compose.yml
|   |-- init-db.sql
|   `-- .env.example
|-- package.json
`-- vite.config.js
```

## Architecture

### Service Overview

- `Frontend`: React app for admin workflows and monitoring
- `order-service`: creates orders, loads customers, keeps product snapshots for order history
- `inventory-service`: stores products, handles stock deduction and stock updates
- `notification-service`: stores notifications, manages read state, profile contacts, and sends critical emails
- `PostgreSQL`: persistent storage for all service databases
- `Redis`: cache layer for order and inventory lookups
- `Kafka`: event bus for order and inventory update events

### Event Flow

```text
+------------------+        HTTP         +------------------+
| React Frontend   | ------------------> | order-service    |
+------------------+                     +------------------+
                                                 |
                                                 | HTTP reserve stock
                                                 v
                                         +------------------+
                                         | inventory-service|
                                         +------------------+
                                                 |
                                                 | publish inventory.updated
                                                 v
 +-------------+    publish order.created   +------------------+    reads and stores    +----------------------+
 | order-service| ------------------------> | Kafka            | ----------------------> | notification-service |
 +-------------+                            +------------------+                         +----------------------+
                                                                                                  |
                                                                                                  | SMTP for critical alerts
                                                                                                  v
                                                                                           Emergency contact emails

All services persist data in PostgreSQL. Redis is used by order-service and inventory-service for short-lived cache entries.
```

## Quick Start

### Prerequisites

- Docker Desktop
- Node.js 18+ and npm

### 1. Configure Backend Environment

Copy the example file:

```powershell
cd backend
copy .env.example .env
```

Update `.env` with your database and SMTP values as needed.

### 2. Start Backend Services

From [`backend`](C:/Users/snk18/Desktop/Codes/OrderFlow/backend):

```powershell
docker compose up --build
```

Backend services:

- Order Service: `http://localhost:8081`
- Inventory Service: `http://localhost:8082`
- Notification Service: `http://localhost:8083`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Kafka: `localhost:9092`

### 3. Start Frontend

From the repo root:

```powershell
npm install
npm run dev
```

Frontend:

- `http://localhost:5173`

## Environment Variables

The backend uses [`backend/.env`](C:/Users/snk18/Desktop/Codes/OrderFlow/backend/.env). These are the main variables required to run the stack.

### Shared Backend Variables

| Variable | Required | Description | Example |
|---|---|---|---|
| `DB_USER` | Yes | PostgreSQL username used by Docker Compose | `postgres` |
| `DB_PASSWORD` | Yes | PostgreSQL password used by Docker Compose | `postgres` |
| `REDIS_PASSWORD` | No | Redis password if you secure Redis | `` |
| `KAFKA_BROKERS` | Yes | Kafka broker list for services | `kafka:9092` |
| `ORDER_SERVICE_PORT` | No | Local reference port for order-service | `8081` |
| `INVENTORY_SERVICE_PORT` | No | Local reference port for inventory-service | `8082` |
| `NOTIFICATION_SERVICE_PORT` | No | Local reference port for notification-service | `8083` |

### Notification Email Variables

| Variable | Required for email alerts | Description | Example |
|---|---|---|---|
| `SMTP_HOST` | Yes | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | Yes | SMTP server port | `587` |
| `SMTP_USER` | Yes | SMTP login username | `your-email@gmail.com` |
| `SMTP_PASS` | Yes | SMTP password or app password | `your-app-password` |
| `SMTP_FROM` | Yes | Sender email address | `your-email@gmail.com` |

### Runtime Variables Injected by Docker Compose

These are set in [`backend/docker-compose.yml`](C:/Users/snk18/Desktop/Codes/OrderFlow/backend/docker-compose.yml) and typically do not need manual changes unless you are customizing the deployment:

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `REDIS_ADDR`
- `GIN_MODE`
- `INVENTORY_SERVICE_URL`

## API Overview

This section documents the primary endpoints exposed by the three backend services.

### Order Service (`http://localhost:8081`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/orders` | Create a new order |
| `GET` | `/orders` | List recent orders |
| `GET` | `/orders/:id` | Fetch one order by ID |
| `GET` | `/customers` | List customers used by the order form |

Example order payload:

```json
{
  "customer_id": 3,
  "product_id": 8,
  "quantity": 2,
  "payment_method": "Credit Card",
  "discount_code": "SAVE10"
}
```

### Inventory Service (`http://localhost:8082`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/inventory` | List products and stock levels |
| `GET` | `/inventory/:product_id` | Fetch one product by ID |
| `POST` | `/inventory` | Create a product |
| `POST` | `/inventory/reserve` | Deduct stock for a placed order |
| `PUT` | `/inventory/:product_id/stock` | Update stock manually |
| `DELETE` | `/inventory/:product_id` | Delete a product |

Example stock update payload:

```json
{
  "stock": 25
}
```

### Notification Service (`http://localhost:8083`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/notifications` | List notifications and unread count |
| `PATCH` | `/notifications/:id/read` | Mark one notification as read |
| `PATCH` | `/notifications/read-all` | Mark all notifications as read |
| `GET` | `/profile` | Fetch admin profile and emergency contacts |
| `POST` | `/profile/emergency-contacts` | Add an emergency contact email |
| `PUT` | `/profile/emergency-contacts/:id` | Update an emergency contact |
| `DELETE` | `/profile/emergency-contacts/:id` | Delete an emergency contact |

## Data Flow Notes

- Orders are written to the `orders` table immediately.
- Stock is deducted synchronously by `inventory-service` during order placement.
- `order-service` also publishes `order.created` to Kafka for downstream consumers.
- `inventory-service` publishes `inventory.updated` after stock changes.
- `notification-service` consumes events, stores notification history, and sends critical stock emails when stock reaches `3` or below.
- Seed data is inserted on first run so the app is not empty.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Vanilla CSS |
| Backend | Go 1.22, Gin, net/http |
| Database | PostgreSQL 15 |
| Cache | Redis |
| Messaging | Apache Kafka, Zookeeper |
| Infrastructure | Docker, Docker Compose |

## Notes

- Critical alert emails require valid SMTP credentials in `backend/.env`.
- `docker compose down` keeps your database volumes.
- `docker compose down -v` removes persisted PostgreSQL and Redis data.
