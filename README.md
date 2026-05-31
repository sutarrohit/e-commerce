# E-Commerce Monorepo

A full-stack e-commerce platform built with Turborepo, TypeScript, and modern web technologies.

## Architecture

![Architecture Diagram](images/architecture-server.png)

## Structure

```
├── apps/
│   ├── server/    # Backend API server (Hono + Prisma + PostgreSQL)
│   └── web/       # Frontend web application (Next.js)
├── packages/      # Shared configurations (TypeScript, ESLint)
├── images/        # Architecture diagrams and assets
└── turbo.json     # Turborepo pipeline configuration
```

---

## Server (`apps/server`)

### Tech Stack

| Layer         | Technology                                      |
| ------------- | ----------------------------------------------- |
| Framework     | [Hono](https://hono.dev/) with Zod-OpenAPI      |
| API Docs      | OpenAPI 3.0 + Swagger UI at `/swagger`          |
| Validation    | [Zod](https://zod.dev/)                         |
| ORM           | [Prisma](https://www.prisma.io/) (PostgreSQL)   |
| Database      | PostgreSQL                                      |
| Logging       | Pino (via `hono-pino`)                          |
| Rate Limiting | `hono-rate-limiter` (100 req / 15 min per IP)   |
| CORS          | Configured via `FRONTEND_URL` env var           |
| Auth          | None (userId passed directly — for development) |
| Runtime       | Node.js (via `@hono/node-server`)               |

### Prerequisites

- Node.js >= 18
- npm 11+
- PostgreSQL instance

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PORT=4000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
LOG_LEVEL="silent"

DATABASE_URL="postgresql://user:password@host:5432/ecommerce"
DIRECT_URL="postgresql://user:password@host:5432/ecommerce"
```

### Getting Started

```bash
# Install dependencies (from root)
npm install

# Generate Prisma client
npm run db:generate -w @ecommerce/api

# Run database migrations
npm run db:migrate -w @ecommerce/api

# Seed the database with 30 sample products
npm run db:seed -w @ecommerce/api

# Start the server in dev mode (from root)
npm run dev
```

The server starts on **http://localhost:4000**.

### Available Scripts

| Command                 | Description                    |
| ----------------------- | ------------------------------ |
| `npm run dev`           | Start all apps in dev mode     |
| `npm run build`         | Build all apps                 |
| `npm run lint`          | Lint all projects              |
| `npm run format`        | Format code with Prettier      |
| `npm run test`          | Run all tests                  |
| `npm run test:watch`    | Run tests in watch mode        |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run db:migrate`    | Run Prisma migrations          |
| `npm run db:generate`   | Generate Prisma client         |
| `npm run db:seed`       | Seed product data              |
| `npm run db:seed:reset` | Reset and re-seed the database |

### API Endpoints

All endpoints are prefixed with `/api/v1`. Interactive docs available at **http://localhost:4000/swagger**.

#### Users

| Method | Path            | Description                                          |
| ------ | --------------- | ---------------------------------------------------- |
| POST   | `/api/v1/users` | Create a new user (generates UUID, returns `{ id }`) |

> No request body needed. Server generates a UUID and creates an empty cart for the user.

#### Products

| Method | Path                   | Description               |
| ------ | ---------------------- | ------------------------- |
| GET    | `/api/v1/products`     | List products (paginated) |
| GET    | `/api/v1/products/:id` | Get single product by ID  |

**Query parameters for listing products:**

| Param   | Type | Default | Description    |
| ------- | ---- | ------- | -------------- |
| `page`  | int  | `1`     | Page number    |
| `limit` | int  | `10`    | Items per page |

#### Cart

| Method | Path                   | Description                 |
| ------ | ---------------------- | --------------------------- |
| POST   | `/api/v1/add/items`    | Add item to cart            |
| GET    | `/api/v1/cart/:userId` | Get current cart with items |

#### Checkout

| Method | Path               | Description                                              |
| ------ | ------------------ | -------------------------------------------------------- |
| POST   | `/api/v1/checkout` | Convert cart into an order (with optional discount code) |

#### Admin

| Method | Path                              | Description                             |
| ------ | --------------------------------- | --------------------------------------- |
| POST   | `/api/v1/admin/generate-discount` | Generate discount for user's Nth order  |
| GET    | `/api/v1/admin/summary`           | Admin dashboard summary (revenue, etc.) |

### Quick Start (Swagger UI)

Open **http://localhost:4000/swagger** in your browser for interactive API documentation.

Typical flow in Swagger:

1. **`POST /api/v1/users`** — click "Try it out", execute to create a user, copy the returned `id`
2. **`GET /api/v1/products`** — browse available products, copy a product `id`
3. **`POST /api/v1/add/items`** — add a product to your cart using the userId from step 1
4. **`POST /api/v1/checkout`** — convert the cart into an order

5. **Browse products** — list available products

   ```bash
   curl http://localhost:4000/api/v1/products
   ```

6. **Add items to cart** — use the `userId` from step 1

   ```bash
   curl -X POST http://localhost:4000/api/v1/add/items \
     -H "Content-Type: application/json" \
     -d '{ "userId": "550e8400-...", "productId": "<product-id>", "quantity": 2 }'
   ```

7. **Checkout** — convert cart into an order
   ```bash
   curl -X POST http://localhost:4000/api/v1/checkout \
     -H "Content-Type: application/json" \
     -d '{ "userId": "550e8400-..." }'
   ```

### Discount System

- Each user has a per-user order counter (`UserOrderCounter`)
- Every 5th order (`nthOrder: 5`) qualifies the user for a **10% discount code**
- Discount codes are single-use, user-tied, and generated via the **admin endpoint**
- Discount codes are applied during checkout to reduce the order total

### Data Model (Prisma)

```
Product          Cart (one per user)    Order
  ├─ id (UUID)     ├─ id (UUID)          ├─ id (UUID)
  ├─ name          ├─ userId (unique)    ├─ userId
  ├─ price (cents) └─ CartItem[]         ├─ items[]
  └─ image              ├─ productId     ├─ subtotal
                        ├─ quantity      ├─ discountCode?
                        └─ price         ├─ total
                                          └─ orderNumber

DiscountCode     OrderCounter (singleton)  UserOrderCounter
  ├─ code (PK)     ├─ id: 1                 ├─ userId (PK)
  ├─ discountPercent ├─ count               └─ count
  ├─ isUsed
  └─ userId
```

> Prices are stored as integers (cents/paise) to avoid floating-point issues.

### Testing

Unit tests are written with **Vitest** and located in `apps/server/tests/unit/`.

```bash
# Run all tests
npm run test -w @ecommerce/api

# Run with coverage
npm run test:coverage -w @ecommerce/api
```

Existing test suites:

- `cart.service.test.ts`
- `checkout.service.test.ts`
- `product.service.test.ts`
- `admin.service.test.ts`

---

## Frontend (`apps/web`)

Built with **Next.js 16** and **React 19**.

## Packages

| Package                        | Description              |
| ------------------------------ | ------------------------ |
| `@ecommerce/typescript-config` | Shared TypeScript config |
| `@ecommerce/eslint-config`     | Shared ESLint config     |
