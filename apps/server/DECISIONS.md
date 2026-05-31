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
