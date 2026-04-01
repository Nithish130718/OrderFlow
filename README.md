# OrderFlow

A full-stack distributed order management system with a React frontend and a Go microservices backend.

---

## Project Structure

```
OrderFlow/
├── src/                    React + Vite frontend
│   ├── components/
│   ├── pages/
│   └── ...
├── backend/                Go microservices backend
│   ├── order-service/
│   ├── inventory-service/
│   ├── notification-service/
│   ├── docker-compose.yml
│   └── README.md           ← Full backend setup guide
├── package.json
└── vite.config.js
```

---

## Quick Start

### Backend (Go microservices)

Requires **Docker Desktop** — see [`backend/README.md`](./backend/README.md) for full setup.

```powershell
cd backend
docker-compose up --build
```

Services available at:
- Order Service → `http://localhost:8081`
- Inventory Service → `http://localhost:8082`
- Notification Service → `http://localhost:8083`

### Frontend (React + Vite)

Requires **Node.js** ([nodejs.org](https://nodejs.org)).

```powershell
npm install
npm run dev
```

Frontend available at `http://localhost:5173`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Vanilla CSS |
| Backend | Go 1.22, Gin framework |
| Event Streaming | Apache Kafka |
| Caching | Redis |
| Database | PostgreSQL 15 |
| Infrastructure | Docker, Docker Compose |
