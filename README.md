# ELVI Music Studio — Management System

A MERN + TypeScript system for a music studio that rents instruments and books
studio rooms: inventory and QR-tagged item tracking, customer records,
product-rental and studio-booking workflows, invoicing, due-date reminders,
and revenue reporting.

## Architecture

```
┌─────────────┐        ┌──────────────────┐        ┌──────────────┐
│  React SPA   │───────▶│  Express API      │───────▶│   MongoDB     │
│  (frontend)  │  HTTPS │  (backend)        │        │  (replica set)│
└─────────────┘        └──────────────────┘        └──────────────┘
                               │
                               ▼
                     Azure Communication Services
                       (email + SMS reminders)
```

- **`frontend/`** — React 19 + Vite + TypeScript. Server state is paged and
  searched on the backend rather than downloaded whole; styling is plain CSS
  with design tokens (`src/styles/tokens.css`) rather than inline styles, so
  hover/focus states, dark mode and print rules all work.
- **`backend/`** — Express + Mongoose + TypeScript, layered as
  `routes → validation (Zod) → controllers → services → models`. Every
  multi-document write (checkout, return, booking) runs inside a MongoDB
  transaction. Pricing is always computed server-side from stored rates —
  the client can never name its own total.
- **MongoDB** must be a replica set (a single-node one is fine for local dev;
  Atlas provides one automatically) because the API uses transactions.

See [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md)
for service-specific detail.

## Getting started

### Prerequisites

- Node.js 22+
- A MongoDB replica set — either [Atlas](https://www.mongodb.com/atlas) (free
  tier works) or Docker Compose (below)

### Quick start with Docker Compose

```bash
cp .env.example .env          # set JWT_SECRET (see the file for how)
docker compose up --build
docker compose exec api npm run seed   # creates the first Admin account
```

The SPA is at http://localhost:8080, the API at http://localhost:5000.

### Running locally without Docker

```bash
# Backend
cd backend
cp .env.example .env          # fill in MONGO_URI and JWT_SECRET
npm install
npm run seed                  # creates the first Admin account (prints it once)
npm run dev                   # http://localhost:5000

# Frontend, in a second terminal
cd frontend
cp .env.example .env          # VITE_API_BASE_URL defaults to localhost:5000
npm install
npm run dev                   # http://localhost:5173
```

Sign in with the credentials the seed script prints — you'll be asked to set
your own password immediately, since the seeded one is single-use.

## Scripts

Both `backend/` and `frontend/` expose the same script names:

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start in watch mode |
| `npm run build` | Production build (backend: compiles to `dist/`; frontend: static bundle to `dist/`) |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` / `lint:fix` | ESLint |
| `npm test` | Vitest — backend tests run against an in-memory MongoDB replica set |

## CI

[.github/workflows/ci.yml](.github/workflows/ci.yml) runs typecheck, lint,
tests and build for both packages on every push and pull request to `main`.

## Security notes

- No secret is committed to this repository. `backend/.env.example` lists
  every variable the API needs; copy it to `.env` and fill in real values.
- If you're working from a clone of the original project history, note that
  earlier commits contained a real `backend/.env`. Rotate the `MONGO_URI`
  credential and `JWT_SECRET` before deploying, and see
  [SECURITY.md](SECURITY.md) for the full remediation steps.

## Notifications: Azure Communication Services

Due-date reminders and account-setup emails go through Azure Communication
Services. Without `AZURE_COMMUNICATION_CONNECTION_STRING` set, the API runs
with a console provider that logs what would have been sent — useful for
local development without a cloud account. See
[backend/.env.example](backend/.env.example) for the full variable list and
[backend/src notes in services/notifications](backend/services/notifications)
for the provider abstraction.

## License

Internal project — no license file present; treat as all rights reserved
unless the repository owner states otherwise.
