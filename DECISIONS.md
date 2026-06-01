# Design Decisions

## Decision 1: Per-User Order Counter (Loyalty-Style)

**Context:** The discount system rewards every nth order with a coupon code. We needed to decide how to track the order sequence — per-user or globally.

**Options Considered:**

- **Option A:** Global order counter — a single shared counter across all users, so every nth order _system-wide_ earns a discount (e.g., "every 100th customer wins").
- **Option B:** Per-user order counter — each user has their own sequence, so every nth order _by that user_ earns a discount.

**Choice:** Per-user order counter (Option B).

**Why:** A per-user counter feels fairer — users are rewarded for their own ordering frequency rather than competing for a global slot. It aligns with loyalty/rewards programs where each customer progresses independently. Implemented as a `UserOrderCounter` table with `userId` as the primary key, upserted inside the checkout transaction alongside the global `OrderCounter` (which is kept for display/reference order numbers). Both counters are incremented atomically with row-level locking to prevent race conditions.

---

## Decision 2: In-Memory / Prisma with PostgreSQL

**Context:** The requirements allow an in-memory store, but the project scaffolds a Prisma + PostgreSQL setup.

**Options Considered:**

- **Option A:** Use an in-memory data structure (e.g., a `Map`) — no external dependencies, trivial to reset.
- **Option B:** Keep the existing Prisma + PostgreSQL setup — full relational model, migrations, type safety.

**Choice:** Keep Prisma + PostgreSQL (Option B).

**Why:** The project was already scaffolded with Prisma, and it provides type-safe queries, migrations, and a clean data model. Using an in-memory store would require rewriting all data access code and lose the benefits of Prisma's schema validation. For a production e-commerce system, a real database is essential anyway. Tests mock Prisma completely, so they remain fast and isolated.

---

## Decision 3: Discount Code Ownership — Tied to User

**Context:** When a discount code is generated (on the nth order), the code must be assigned to someone. We needed to decide whether codes are anonymous or user-bound.

**Options Considered:**

- **Option A:** Anonymous codes — any user can apply any generated code at checkout.
- **Option B:** User-bound codes — each code is tied to the userId that earned it, and only that user can apply it.

**Choice:** User-bound codes (Option B).

**Why:** This prevents a race-to-claim scenario where one user earns a code and another redeems it first. It also feels more natural ("you earned this, you use it"). The `DiscountCode` model has a required `userId` field, and the checkout service validates that the applying user owns the code. This adds a `403 Forbidden` case but eliminates a class of abuse.

---

## Decision 4: Separate Services vs. Logic in Handlers

**Context:** The route handlers for cart, checkout, and admin need to perform business logic. We needed to decide where to put that logic.

**Options Considered:**

- **Option A:** Inline logic in route handlers — fewer files, simpler for small operations.
- **Option B:** Separate service layer — handlers delegate to service functions that contain all business logic.

**Choice:** Separate service layer (Option B).

**Why:** Separation of concerns — handlers handle HTTP concerns (parsing requests, returning responses), while services contain pure business logic that can be unit-tested without HTTP infrastructure. The existing codebase already follows this pattern (`cart.service.ts`, `checkout.service.ts`). Tests can mock Prisma at the service level and test all edge cases without starting a server.

---

## Decision 5: Discount Amount Calculation — Floor Division

**Context:** When a percentage discount is applied, the resulting discount amount may be fractional (e.g., 10% of 1999 = 199.9). We needed to decide how to handle rounding.

**Options Considered:**

- **Option A:** Round to nearest integer — `Math.round()`.
- **Option B:** Floor (truncate) — `Math.floor()`.
- **Option C:** Ceiling — `Math.ceil()`.

**Choice:** Floor division (Option B).

**Why:** Flooring the discount amount means the customer never gets more discount than the percentage strictly entitles them to, and the store never loses a fraction to rounding up. All prices are stored as integers (cents), so we stay in integer arithmetic. `Math.floor((subtotal * discountPercent) / 100)` ensures predictable, conservative rounding.

---

## Decision 6: Transactional Checkout with Row Locking

**Context:** Checkout involves multiple steps (validate cart, increment counter, create order, clear cart). Concurrent checkouts could race on the order counter or create inconsistent state.

**Options Considered:**

- **Option A:** No transaction — each step individually, accept potential race conditions.
- **Option B:** Prisma `$transaction` with serializable isolation.
- **Option C:** Prisma `$transaction` with explicit row locks (`SELECT ... FOR UPDATE`).

**Choice:** Transaction with explicit row locking (Option C).

**Why:** Wrapping all checkout steps in a transaction ensures atomicity — either everything succeeds or nothing changes. Adding `FOR UPDATE` on the product rows prevents phantom reads and ensures the inventory snapshot is consistent. The OrderCounter row is updated within the same transaction, so two concurrent checkouts cannot get the same order number. This is a bit more verbose but guarantees correctness under load.

---

## Decision 7: Prices in Cents (Integer)

**Context:** Prices could be stored as floats (e.g., `19.99`) or as integers (e.g., `1999`).

**Options Considered:**

- **Option A:** Float/decimal — `19.99` stored as a float.
- **Option B:** Integer (cents) — `1999` stored as an integer.

**Choice:** Integer cents (Option B).

**Why:** Floating-point arithmetic causes precision errors with currency (e.g., `0.1 + 0.2 !== 0.3`). Storing prices as integers in the smallest currency unit eliminates rounding errors entirely. The frontend can format for display (e.g., `(1999 / 100).toFixed(2)`). This is a widely-adopted pattern in e-commerce systems.

---

## Decision 8: Anonymous User Identity (Auto-Generated UUID)

**Context:** Users need an identity for cart and discount functionality, but full authentication adds significant complexity for a prototype/demo e-commerce system.

**Options Considered:**

- **Option A:** Full authentication — email/password registration, OAuth, session management.
- **Option B:** Auto-generated anonymous UUID — no registration, each client gets a random UUID on first visit.

**Choice:** Anonymous UUID (Option B).

**Why:** Avoids the overhead of auth flows (password hashing, session tokens, password resets). The `createUser()` service generates a `randomUUID()` and creates a `Cart` row in the same call, so every user immediately has a working cart. Users can optionally store their ID in `localStorage` for persistence. This is pragmatic for a demo — auth can be layered on later without breaking the data model.

---

## Decision 9: Pre-Checkout Discount Validation Endpoint

**Context:** The checkout flow applies a discount code and returns the final total, but the frontend needs to show whether a code is valid (and the resulting discount amount) _before_ the user submits the order.

**Options Considered:**

- **Option A:** Inline validation — only validate the discount code during checkout submission; return errors if invalid.
- **Option B:** Separate validation endpoint — a dedicated `POST /api/v1/discount/validate` that checks the code and returns the computed discount without placing an order.

**Choice:** Separate validation endpoint (Option B).

**Why:** Provides instant UX feedback — the user can see "20% off — saves $4.00" before committing to checkout. Keeps the checkout handler focused on order placement. The validation logic is shared (both endpoints call the same `validateDiscount` service), so there's no duplication.

---

## Decision 10: Deployment — AWS Lambda with CDK (no API Gateway)

**Context:** The server needs to be deployed to production with a reproducible infrastructure definition.

**Options Considered:**

- **Option A:** Traditional server (EC2, ECS) — full control but requires managing servers, scaling, and availability.
- **Option B:** API Gateway + Lambda — managed HTTP gateway with request/response transforms, but adds cost and complexity.
- **Option C:** Lambda Function URL — direct HTTPS endpoint on the Lambda without API Gateway.

**Choice:** Lambda Function URL via AWS CDK (Option C).

**Why:** Function URLs eliminate API Gateway cost and configuration while still providing a public HTTPS endpoint. AWS CDK (with `aws-cdk-lib`) provides infrastructure-as-code in TypeScript, keeping the stack definition in the same repo and language as the application. The `@hono/aws-lambda` adapter wraps the Hono app with zero code changes — the same `app.ts` works in dev (`@hono/node-server`) and production (Lambda).

---

## Decision 11: Frontend — Next.js 16 App Router + TanStack Query + shadcn/ui

**Context:** The frontend needs a modern framework to build the e-commerce UI (product listing, cart, checkout, admin dashboard).

**Options Considered:**

- **Option A:** Plain React / Vite SPA — simple but lacks SSR, file-based routing, and built-in optimizations.
- **Option B:** Next.js Pages Router — mature but being superseded by the App Router.
- **Option C:** Next.js 16 App Router — latest React patterns (server components, streaming), file-based routing, and built-in image/font optimization.

**Choice:** Next.js 16 App Router with TanStack Query and shadcn/ui (Option C).

**Why:** Next.js App Router provides a modern React foundation with server components, layout nesting, and edge-ready deployment. TanStack Query handles server state caching, background refetching, and optimistic updates with minimal boilerplate. shadcn/ui (Radix + Tailwind CSS 4) provides accessible, unstyled primitives that match the design system. The `"use client"` boundary is used sparingly — data fetching stays in TanStack Query hooks while presentational components remain server-renderable.

---

## Decision 12: API Framework — Hono with Zod-OpenAPI

**Context:** The server API needs request validation, type-safe route definitions, and automatically generated OpenAPI documentation.

**Options Considered:**

- **Option A:** Express + Zod — widely used but manually wiring validation to routes is verbose; no built-in OpenAPI generation.
- **Option B:** Fastify + TypeBox — fast and typed, but TypeBox has a steeper learning curve.
- **Option C:** Hono with `@hono/zod-openapi` — lightweight, Zod-native validation, and OpenAPI spec generation from route definitions.

**Choice:** Hono with `@hono/zod-openapi` and Stoker (Option C).

**Why:** Hono is lightweight (~14 KB), fast, and runs on Node.js, Lambda, and Cloudflare Workers from the same codebase. `@hono/zod-openapi` derives both runtime validation and OpenAPI 3.0 specs from a single Zod schema — no drift between validation and documentation. Stoker provides sensible defaults (error formatting, status code constants). The OpenAPI spec is served at `/doc` via `@hono/swagger-ui`.
