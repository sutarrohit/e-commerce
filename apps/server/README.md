# E-commerce API

A Hono-based e-commerce backend with cart, checkout, and admin APIs. Features a global discount campaign — every Nth order earns a coupon code.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Hono (with Zod-OpenAPI for schema validation + Swagger docs)
- **Database:** PostgreSQL via Prisma ORM
- **Testing:** Vitest

## Setup

```bash
# Install dependencies
npm install

# Copy environment
cp .env.example .env

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Seed product data
npm run db:seed

# Start dev server (http://localhost:4000)
npm run dev
```

## API Endpoints

### Cart

| Method | Path                | Description      |
| ------ | ------------------- | ---------------- |
| POST   | `/api/v1/add/items` | Add item to cart |

**Request:**

```json
{ "userId": "uuid", "productId": "uuid", "quantity": 2 }
```

### Checkout

| Method | Path               | Description    |
| ------ | ------------------ | -------------- |
| POST   | `/api/v1/checkout` | Place an order |

**Request:**

```json
{ "userId": "uuid", "discountCode": "CODE1234" }
```

**Response** includes the order and (if applicable) a newly earned discount code.

### Admin

| Method | Path                              | Description                                                  |
| ------ | --------------------------------- | ------------------------------------------------------------ |
| POST   | `/api/v1/admin/generate-discount` | Generate a discount code if the order count condition is met |
| GET    | `/api/v1/admin/summary`           | Get sales and discount summary                               |

## Discount System

- A global `OrderCounter` tracks every order placed.
- Every 5th order (configurable) automatically generates a 10%-off discount code.
- The code is assigned to the user who placed the nth order.
- Codes can be applied at checkout by their owner.

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

## Swagger Docs

Once running, visit `http://localhost:4000/swagger` for interactive API documentation.
