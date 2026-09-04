# ELVI Backend

Express + Mongoose + TypeScript API.

## Layering

```
routes/       Express routers — wire a URL + method to validation + a controller
validation/   Zod schemas, applied by the `validate` middleware before a
              controller ever sees a request
controllers/  Thin: pull typed input off the request, call one service method,
              send its result. No try/catch — asyncHandler forwards any
              rejection to the central error middleware.
services/     All business logic and every Mongoose call lives here.
models/       Mongoose schemas + indexes.
middleware/   auth (JWT), validate, errorHandler.
utils/        pricing (the only place money is computed), transaction,
              paginate, AppError, logger, cronJobs.
```

A request that fails calls `throw badRequest(...)` (or `notFound`,
`conflict`, `forbidden`, `unauthorized` — see `utils/AppError.ts`) from a
service; `asyncHandler` catches it and `middleware/errorHandler.ts` turns it
into a response. Nothing needs its own try/catch.

## Money and transactions

- `utils/pricing.ts` is the only place a rental or booking amount is
  computed. Every price comes from a stored rate (`Inventory.baseRentalPrice`,
  `Room.hourlyRate`) — a request body can supply items and dates, never an
  amount.
- Checkout, return, and studio booking each run inside a MongoDB transaction
  (`utils/transaction.ts`), so a failure partway through never leaves
  inventory flagged `Rented` with no matching rental. This requires MongoDB
  to be a replica set.
- Availability is claimed with a conditional `updateMany`, not a
  check-then-write — see `rentalService.createNewRental` for why.

## Environment

Copy `.env.example` to `.env`. `config/env.ts` validates it at boot with Zod
and exits immediately with a readable error if something required is missing
— failures surface at startup, not three requests into production.

## Scripts

```bash
npm run dev         # ts-node + nodemon
npm run build        # tsc -> dist/
npm start             # node dist/server.js
npm run seed          # bootstraps an Admin account + default studio rooms
npm run typecheck
npm run lint / lint:fix
npm test              # vitest, against an in-memory MongoDB replica set
```

## Testing

`tests/setup.ts` spins up a one-node `mongodb-memory-server` replica set (a
transaction requires one — a standalone server rejects them), so the tests
exercise the same transactional code paths production uses. `tests/helpers.ts`
has factories for the common fixtures (user, customer, inventory item, room).

Coverage focuses on the areas most likely to lose money or data if wrong:
pricing math, the rental/return lifecycle (including the two concurrent
double-booking races), invoice line-sourcing, and auth (password hashing,
token invalidation on password change, admin-only routes).

## Notifications

`services/notifications/` defines a small provider interface
(`NotificationProvider`) with two implementations: `AzureNotificationProvider`
(Azure Communication Services) and `ConsoleNotificationProvider` (logs
instead of sending — used automatically when
`AZURE_COMMUNICATION_CONNECTION_STRING` is unset, so local dev needs no cloud
account). `userService` and `utils/cronJobs.ts` depend only on the interface
in `./types`, never on a concrete SDK.

## Scheduled jobs

`utils/cronJobs.ts` runs a due-date reminder sweep. Each rental tracks which
reminder kinds it has already received (`remindersSent`), and the claim is
made atomically before dispatch, so a restart, a second instance, or a manual
trigger from the admin UI cannot double-send. Set `ENABLE_CRON=false` when
running more than one API instance and drive the job from an external
scheduler instead (an Azure Function timer trigger, for example) — see the
`REMINDER_CRON` variable for the cron expression it would use.
