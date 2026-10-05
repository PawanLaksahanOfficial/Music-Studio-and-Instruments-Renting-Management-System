# ELVI Music Studio — Management System

Staff app for running a music studio: instrument rentals with QR checkout and returns, studio room bookings, invoicing, customers, staff accounts and business statistics. Works on phones, tablets and desktops, in light and dark themes.

| Layer | Stack |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4, Radix UI primitives (shadcn-style components), TanStack Query + Table, React Hook Form + Zod, Recharts |
| Backend | Node.js ≥ 20, Express 5, TypeScript, Mongoose 9 (MongoDB **replica set** required), Zod, Pino |
| Notifications | AWS SNS (SMS) and SES (email) |

## Quick start

### Try it without a database

```bash
cd backend && npm install && npm run dev:demo      # API on :5000 with an in-memory MongoDB + sample data
cd frontend && npm install && npm run dev          # http://localhost:5173
```

Sign in with `admin / Demo1234` (Admin) or `cashier / Demo1234` (Cashier). The user `ishara / Welcome123` shows the forced password-change flow. Demo data disappears when the API stops, and no SMS or email is ever sent in demo mode.

### Run against your database

1. Copy `backend/.env.example` to `backend/.env` and fill it in. At minimum you need:
   - `MONGO_URI`: a replica set. MongoDB Atlas works as is. For a local `mongod`, start it with `--replSet rs0` and run `rs.initiate()`.
   - `JWT_SECRET`: at least 32 random characters, e.g. `openssl rand -base64 48`. **The server refuses to start without a valid secret.**
2. Create the first admin with `npm run seed` (in `backend/`). It uses `SEED_ADMIN_PASSWORD`, or generates a password and prints it once. That admin must choose a new password at first sign-in.
3. Run `npm run dev` in both `backend/` and `frontend/`. Vite proxies `/api` to `localhost:5000`, so the session cookie stays first-party.

> **Security notice:** an earlier `backend/.env`, containing the MongoDB connection string and JWT secret, was committed to this repository. It is no longer tracked, but it remains in git history. **Rotate the MongoDB Atlas database user's password and set a new `JWT_SECRET`.** Treat the old values as public.

## Scripts

| Where | Command | What it does |
|---|---|---|
| backend | `npm run dev` | API with reload (tsx watch) |
| backend | `npm run dev:demo` | API + in-memory MongoDB + sample data |
| backend | `npm test` | Integration tests (Vitest + Supertest + in-memory replica set) |
| backend | `npm run typecheck` / `npm run build` / `npm start` | Type-check, compile to `dist/`, run the compiled server |
| backend | `npm run seed` | Create the first admin user |
| frontend | `npm run dev` / `npm run build` / `npm run preview` | Dev server, production build, preview the build |
| frontend | `npm run lint` / `npm run typecheck` | ESLint, TypeScript |

## Project structure

```
backend/
  app.ts, server.ts      Express app (testable) / process entry (DB connect, cron, graceful shutdown)
  config/                env validation (zod), DB connection, business constants
  middleware/            auth (JWT cookie + roles), validation, security (helmet, CORS, rate limits, CSRF), errors
  validators/            zod request schemas per resource
  routes/ → controllers/ → services/ → models/   thin controllers; business rules live in services
  utils/                 logger, AppError, transactions, document numbers, dates, AWS, cron jobs
  scripts/               seed.ts, demo.ts
  tests/                 API integration tests
frontend/src/
  api/                   TanStack Query hooks per resource
  components/ui/         design-system primitives (button, dialog, combobox, …)
  components/data/       DataTable (table on desktop, cards on phones), page header, stat cards, dialogs
  components/layout/     app shell (sidebar, drawer, bottom tab bar, ⌘K palette), route guards
  features/<area>/       pages and their dialogs
  lib/, providers/, hooks/, types/
```

## Security model

- **Sessions.** A signed JWT (HS256 pinned, with issuer, audience and expiry) lives in an `httpOnly`, `SameSite=Strict` cookie scoped to `/api`, and is `Secure` in production. JavaScript never sees the token. Every request re-checks that the user is still active, and a per-user `tokenVersion` revokes sessions instantly on sign-out, password change, role change or deactivation.
- **CSRF.** SameSite=Strict cookies, plus a required `X-Requested-With` header on state-changing requests, plus a CORS allowlist (`CORS_ORIGINS`).
- **Input.** Every route validates its body, params and query with Zod (unknown fields are stripped). A global guard rejects MongoDB operator keys (`$ne`, dotted paths, `__proto__`).
- **Business integrity.** Prices, late fees and invoice totals are always computed on the server; amounts sent by the client are ignored. Item reservations, rental + invoice creation, returns and studio bookings run in MongoDB transactions, so double-renting or double-booking is impossible even with simultaneous requests.
- **Access control.** Cashiers run rentals, bookings, invoices and returns. Admins also manage inventory, customers, staff, archives and statistics, and can override late fees. Admins cannot delete, deactivate or demote themselves, and the last active admin can't be removed.
- **Accounts.** Passwords use bcrypt (12 rounds) and require at least 8 characters with a letter and a number. Admin-set passwords are temporary, so the user must choose their own at first sign-in. "Email sign-in details" generates a random temporary password server-side; admins never see it.
- **Hardening.** Helmet (CSP, HSTS, nosniff, frame protection), `Permissions-Policy` (camera allowed on this origin only), rate limits (global and per login account), a 100 KB body limit, and errors without internal details (each response carries a `requestId`).
- **Logging.** Structured JSON logs (pino) with request IDs. Credentials and cookies are redacted, and phone numbers and emails are masked. Security-relevant events are logged with the acting user (`auth.login_failed`, `user.deactivated`, `rental.late_fee_override`, …).

## Deploying (Vercel + Render)

The website goes on **Vercel** (`frontend/`, configured by `frontend/vercel.json`) and the API on **Render** (`backend/`, configured by `render.yaml`). Give both their own subdomain of one domain, for example `elvistudio.dpdns.org` for the site and `api.elvistudio.dpdns.org` for the API, so the session cookie counts as same-site.

1. **Render** → New → Blueprint → this repo. Set `MONGO_URI` and `CORS_ORIGINS=https://<site domain>`. `JWT_SECRET` is generated for you. Add Render's outbound IPs (service → Connect → Outbound) to MongoDB Atlas Network Access.
2. **Vercel** → New Project → this repo, root directory `frontend`. Set the environment variable `VITE_API_URL=https://<api domain>/api`.
3. Add the custom domains in both dashboards, and create the DNS records they show you (Cloudflare: proxy status "DNS only").

Vercel's free Hobby plan is for non-commercial use only, and Render's free plan sleeps when idle. Use paid plans for a business that relies on the app daily.

## Deployment notes

- **Same-site deployment is required for the cookie.** Either set `SERVE_CLIENT=true` so the API serves `frontend/dist` (one origin), or host the frontend and API on the same site (e.g. `app.example.com` + `api.example.com`). In the second case, list the frontend origin in `CORS_ORIGINS` and set `VITE_API_URL`.
- Behind a reverse proxy or load balancer, set `TRUST_PROXY` (usually `1`) so rate limiting sees real client IPs.
- Health probes: `GET /healthz` (process up) and `GET /readyz` (database connected).
- The server shuts down gracefully on `SIGTERM`. The overdue job runs hourly and reminder SMS/email go out daily at 09:00 in `APP_TIMEZONE`. Reminders are recorded on each rental, so they are never sent twice.
- Rate limits and cron run in memory per process. If you run more than one instance, see the suggestions below.

## Upgrading existing data

No migration script is needed:
- New fields are optional, with fallbacks for older records (`baseAmount`, per-item `dailyRate`, invoice line `kind`, `paidAt`).
- Existing `PR-…`/`SR-…`/`INV-…` numbers stay valid, and new ones look like `PR-2026-000123`.
- Indexes are built automatically on start.
- Everyone signs in once more after the upgrade, because sessions moved from localStorage to cookies.

API changes for any other clients:
- `PATCH /rentals/:id/status` and `POST /rentals/process-return` are replaced by `PATCH /rentals/:id`, `PATCH /rentals/:id/extend`, `GET /rentals/:id/return-quote` and `POST /rentals/:id/return`.
- `POST /users/share-credentials` is replaced by `POST /users/:id/send-login-details`.
- Rental creation takes `itemIds` and returns `{ rental, invoice }`.

## Suggested next improvements

1. Server-side pagination, search and sorting for all lists (needed once data grows into the thousands).
2. A dashboard home: returns due today, overdue items, today's studio schedule, revenue trend.
3. A studio calendar view, plus a room catalogue with hourly rates so studio prices are computed on the server too.
4. An audit-log collection (who changed payments, fees or roles) with an admin viewer.
5. Refresh-token rotation, a device/session list, and optional TOTP 2FA for admins.
6. CI (GitHub Actions: lint, typecheck, tests, `npm audit`), Dependabot, and Playwright end-to-end tests.
7. Shared API types (a `packages/types` workspace or OpenAPI + generated client) so the frontend and backend can't drift.
8. Error and uptime monitoring (Sentry, health checks) and log shipping.
9. Redis-backed rate limiting and a cron lock for multi-instance deployments, and Docker Compose for local parity.
10. Customer-facing extras: payment links, WhatsApp reminders, deposits/security holds, maintenance scheduling with costs, and an installable PWA for staff phones.
