# OrderFlow — Distributed Order Management System

A production-grade distributed microservices backend built in **Go** with event-driven architecture. Three independent services communicate via **Apache Kafka**, persist data in **PostgreSQL**, and cache reads with **Redis**. Start everything with one command.

---

## Prerequisites (Brand New Laptop)

You only need **one thing installed** — Docker Desktop. Go is **not required** locally; everything compiles inside Docker.

### Step 1 — Install Docker Desktop

1. Go to [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2. Click **"Download for Windows"**
3. Run the installer (it installs Docker + Docker Compose together)
4. After install, **restart your computer** when prompted
5. Open Docker Desktop from the Start Menu and wait for it to say **"Engine running"** (green dot in the bottom left)

> ⚠️ Docker Desktop must be running in the background before you do anything else.

---

## Running the Project

### Step 1 — Open a terminal

Press `Win + R`, type `powershell`, hit Enter.

### Step 2 — Navigate to the project folder

```powershell
cd C:\Users\snk18\Desktop\Codes\OrderFlow\distributed-order-system
```

### Step 3 — Start all services

```powershell
docker-compose up --build
```

That's it. This single command will:

1. Download PostgreSQL, Redis, Kafka, and Zookeeper images
2. Build the 3 Go services from source inside Docker
3. Run all 7 containers in the correct startup order
4. Auto-create all database tables and seed inventory data

> ⏱️ **First run takes 3–5 minutes** (downloading images + building). Every run after that starts in under 30 seconds.

### What "ready" looks like

Wait until you see all three of these lines in the logs:

```
orderflow-order-service       | [Order-Service] Starting on port 8081
orderflow-inventory-service   | [Inventory-Service] Starting on port 8082
orderflow-notification-service| [Notification-Service] Starting on port 8083
```

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Client / Frontend                  │
└──────────────┬───────────────────────────────────────┘
               │ REST API
               ▼
┌──────────────────────┐      Kafka: order.created
│   Order Service      │ ──────────────────────────────────────────┐
│   localhost:8081     │                                           │
│                      │                                           ▼
│  POST  /orders       │              ┌──────────────────────┐    ┌─────────────────────────┐
│  GET   /orders/:id   │              │  Inventory Service   │    │  Notification Service   │
│  GET   /orders       │              │  localhost:8082       │    │  localhost:8083          │
│                      │              │                      │    │                         │
│  ┌────────────────┐  │              │  GET /inventory      │    │  Consumes:              │
│  │  orders_db     │  │              │  GET /inventory/:id  │    │  • order.created        │
│  │  (PostgreSQL)  │  │              │                      │    │  • inventory.updated    │
│  └────────────────┘  │              │  ┌────────────────┐  │    │                         │
│  ┌────────────────┐  │              │  │ inventory_db   │  │    │  Simulates:             │
│  │  Redis Cache   │  │              │  │ (PostgreSQL)   │  │    │  📧 Email alerts        │
│  │  5 min TTL     │  │              │  └────────────────┘  │    │  📱 SMS alerts          │
│  └────────────────┘  │              │  ┌────────────────┐  │    │                         │
└──────────────────────┘              │  │  Redis Cache   │  │    │  ┌───────────────────┐  │
                                      │  │  2 min TTL     │  │    │  │ notifications_db  │  │
                                      │  └────────────────┘  │    │  │ (PostgreSQL)      │  │
                                      └──────────┬───────────┘    │  └───────────────────┘  │
                                                 │ Kafka:          └─────────────────────────┘
                                                 │ inventory.updated
                                                 └──────────────────────────────────────────▶
                                                          (also consumed by Notification Service)

Infrastructure:
  ┌─────────────┐   ┌─────────────┐   ┌──────────────────────────┐
  │  PostgreSQL │   │    Redis    │   │   Kafka  +  Zookeeper    │
  │   :5432     │   │   :6379     │   │         :9092            │
  └─────────────┘   └─────────────┘   └──────────────────────────┘
```

---

## Services & Endpoints

### Order Service — `http://localhost:8081`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/orders` | Create a new order |
| `GET` | `/orders/:id` | Get order by ID (Redis cached) |
| `GET` | `/orders` | List all orders |
| `GET` | `/health` | Health check |

### Inventory Service — `http://localhost:8082`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/inventory` | List all products and stock |
| `GET` | `/inventory/:product_id` | Get stock for a product (Redis cached) |
| `GET` | `/health` | Health check |

### Notification Service — `http://localhost:8083`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |

> Notification service is event-driven — no REST API needed. It logs everything to the terminal and to `notifications_db`.

---

## Testing the API

Open a **second PowerShell window** (leave docker-compose running in the first).

### 1. Create an order

```powershell
curl -X POST http://localhost:8081/orders `
  -H "Content-Type: application/json" `
  -d '{"user_id": 1, "product_id": 2, "quantity": 5}'
```

**Expected response (201):**
```json
{
  "message": "Order created successfully",
  "order": {
    "id": 1,
    "user_id": 1,
    "product_id": 2,
    "quantity": 5,
    "status": "pending",
    "created_at": "2026-04-01T..."
  }
}
```

After this, you should see in the **first window**:
```
order-service      | Published event to topic 'order.created'
inventory-service  | Stock updated — product 2: 200 -> 195 (deducted 5)
inventory-service  | Published event to topic 'inventory.updated'
notification-service | 📧 [EMAIL] To: user_1@example.com | Subject: Order #1 Confirmed
notification-service | 📱 [SMS] To: +1-555-01 | Message: Order #1 placed successfully!
```

### 2. Fetch an order

```powershell
# First call — hits PostgreSQL
curl http://localhost:8081/orders/1

# Second call — returns from Redis cache (notice "source": "cache")
curl http://localhost:8081/orders/1
```

### 3. Check inventory stock

```powershell
curl http://localhost:8082/inventory/2
```

### 4. List all orders

```powershell
curl http://localhost:8081/orders
```

### 5. Check service health

```powershell
curl http://localhost:8081/health
curl http://localhost:8082/health
curl http://localhost:8083/health
```

---

## Inspecting Data Directly

### View PostgreSQL tables

```powershell
# Orders
docker exec -it orderflow-postgres psql -U postgres -d orders_db -c "SELECT * FROM orders;"

# Inventory
docker exec -it orderflow-postgres psql -U postgres -d inventory_db -c "SELECT * FROM inventory;"

# Notifications
docker exec -it orderflow-postgres psql -U postgres -d notifications_db -c "SELECT * FROM notifications;"
```

### Verify Redis cache

```powershell
# Check if order 1 is cached
docker exec -it orderflow-redis redis-cli GET order:1

# Check if inventory product 2 is cached
docker exec -it orderflow-redis redis-cli GET inventory:2

# List all cache keys
docker exec -it orderflow-redis redis-cli KEYS "*"
```

---

## Useful Commands

```powershell
# View logs for a specific service
docker-compose logs -f order-service
docker-compose logs -f inventory-service
docker-compose logs -f notification-service

# Check running containers
docker-compose ps

# Restart a single service (e.g., after a code change)
docker-compose up --build order-service

# Stop all services (preserves data)
docker-compose down

# Stop and wipe all data (fresh start)
docker-compose down -v
```

---

## Seeded Data

The inventory starts with these products on first launch:

| Product ID | Initial Stock |
|------------|---------------|
| 1 | 100 |
| 2 | 200 |
| 3 | 150 |
| 4 | 75 |
| 5 | 300 |

---

## Troubleshooting

**"Cannot connect to the Docker daemon"**
→ Open Docker Desktop from the Start Menu and wait for the green "Engine running" status.

**Services keep restarting / "connection refused"**
→ Kafka takes ~30 seconds to be ready. The services will auto-retry — just wait and watch the logs.

**Port already in use**
→ Run `docker-compose down` first to stop any previous containers.

**Want a completely fresh start**
→ Run `docker-compose down -v` to remove containers and all data volumes, then `docker-compose up --build`.

---

## Project Structure

```
distributed-order-system/
├── order-service/
│   ├── main.go               Entry point, HTTP server on :8081
│   ├── handlers/order.go     REST handlers
│   ├── models/order.go       Structs and event types
│   ├── db/postgres.go        DB connection + auto-migration
│   ├── cache/redis.go        Redis client
│   ├── kafka/producer.go     Kafka event publisher
│   ├── go.mod / go.sum
│   └── Dockerfile
├── inventory-service/
│   ├── main.go               Entry point, HTTP server on :8082
│   ├── handlers/inventory.go REST handlers
│   ├── models/inventory.go   Structs and event types
│   ├── db/postgres.go        DB connection + auto-migration + seed
│   ├── cache/redis.go        Redis client (2-min TTL)
│   ├── kafka/consumer.go     Consumes order.created, deducts stock
│   ├── kafka/producer.go     Publishes inventory.updated
│   ├── go.mod / go.sum
│   └── Dockerfile
├── notification-service/
│   ├── main.go               Entry point, health check on :8083
│   ├── models/notification.go Struct
│   ├── db/postgres.go        DB connection + auto-migration
│   ├── kafka/consumer.go     Consumes both topics, logs + alerts
│   ├── go.mod / go.sum
│   └── Dockerfile
├── docker-compose.yml        Full infrastructure (7 containers)
├── init-db.sql               Creates all 3 PostgreSQL databases
├── .env.example              Environment variable reference
└── README.md                 This file
```
