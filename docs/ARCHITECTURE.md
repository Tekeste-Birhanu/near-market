# Architecture

## 1. Overview

- **Application:** Near Market, a Telegram Mini App marketplace.
- **Architecture style:** React Mini Apps and a shared Node.js service that provides a REST API and handles both Telegram bots, backed by PostgreSQL.
- **Repository layout:** One project with `client/`, `server/`, and `docs/` folders.
- **Deployment target:** Undecided.
- **Key constraints:** The marketplace bot and separate admin bot run through the same Node.js backend service. Telegram identity data must be validated by the backend before use.

## 2. Technology stack

| Area | Choice | Notes |
|---|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS | Marketplace Mini App and Admin Mini App UIs; Tailwind CSS is integrated through its Vite plugin. |
| Backend | Node.js + TypeScript + Express | One shared service provides the REST API and handles both bots. |
| Package manager | npm workspaces | Manage the `client/` and `server/` packages from the repository root. |
| Telegram bot framework | Telegraf | Separate bot instances for the marketplace bot and admin bot run in the shared backend. |
| Database access | Prisma ORM 7 | Typed database access and schema migrations for PostgreSQL. |
| Database / storage | PostgreSQL | Stores marketplace records and listing image bytes using `bytea`. No external object storage is used in v1. |
| Authentication | Telegram Mini App `initData` | Validate on the backend before trusting user identity or username. |
| Hosting / deployment | Undecided |  |

## 3. System boundaries

```text
Telegram client
  ├── Marketplace bot → Marketplace Mini App ─┐
  └── Admin bot → Admin Mini App ─────────────┤
                  │                            │
                  └── Shared Node.js service ◄─┘
                      ├── REST API
                      ├── Both bot integrations
                      └── Prisma ORM 7 → PostgreSQL
```

The project is kept in one repository with `client/`, `server/`, and `docs/` folders. The `client/` folder contains the Marketplace and Admin Mini Apps. The `server/` folder contains the REST API and integrations for both bots. Both Mini Apps and both bots use the same Node.js backend service; the admin bot launches the Admin Mini App. The backend accesses PostgreSQL through Prisma ORM 7. Telegraf handles bot commands and incoming updates for both bots. The Mini Apps use Telegram's Web App API in the client, while the backend validates Mini App `initData` for authentication.

## 4. Modules and responsibilities

| Module / area | Responsibility | Important dependencies or boundaries |
|---|---|---|
| Marketplace Mini App | Browse, search, filter, post, and manage listings; show seller profiles and contact options. | React + TypeScript; accesses data through the shared API. |
| Marketplace bot | Open the Marketplace Mini App and support Telegram-related interactions. | Telegraf instance using the Telegram Bot API; runs in the shared Node.js backend service. |
| Admin Mini App and bot | Provide the same Items, House rentals, and Profile pages as the Marketplace Mini App, plus an admin Dashboard; allow admins to remove listings. | Separate Telegraf instance using the Telegram Bot API; the admin bot launches the Admin Mini App. Both use the shared Node.js backend service. |
| Backend service | Provide the REST API, validate Telegram identity, enforce ownership and admin permissions, validate listing data and images, handle both bots, and coordinate persistence. | Node.js + TypeScript + Express; accesses PostgreSQL through Prisma ORM 7. |
| PostgreSQL | Persist users, listings, and listing image bytes; provide data for admin dashboard totals. | Backend is the only trusted writer. Dashboard totals are derived from stored user and listing data. |

## 5. Key technical decisions

- **D-01 — Shared TypeScript stack:** Use React + TypeScript for the Mini App and Node.js + TypeScript for the backend, keeping the frontend and backend in one language ecosystem.
- **D-02 — Express API:** Use Express to implement the Node.js API.
- **D-03 — Shared backend for both bots:** The marketplace bot and separate admin bot use the same backend API and PostgreSQL database.
- **D-04 — PostgreSQL-only storage for v1:** Store marketplace records and listing photo bytes in PostgreSQL using `bytea`; calculate admin dashboard totals from stored user and listing data. Do not add a separate object storage service in v1.
- **D-05 — Server-validated Telegram identity:** The backend validates Telegram Mini App `initData` before accepting identity or username data.
- **D-06 — REST API:** Both Mini Apps communicate with the shared backend through a REST API implemented with Express.
- **D-07 — Prisma ORM 7:** Use Prisma ORM 7 for typed database access and PostgreSQL schema migrations.
- **D-08 — Single project repository:** Keep the frontend, backend, and project documentation in one repository under `client/`, `server/`, and `docs/` folders.
- **D-09 — Vite frontend tooling:** Use Vite to build and serve the React + TypeScript Mini Apps.
- **D-10 — Telegraf for bot integrations:** Use Telegraf for both bots in the shared Node.js + TypeScript backend. The React Mini Apps use Telegram's Web App API separately; Telegraf handles bot commands and updates and does not replace the Mini App API.
- **Bot startup:** Keep marketplace bot startup opt-in for local development. When enabled, require a server-side bot token and an HTTPS Mini App URL reachable from Telegram; production update transport remains deferred until hosting is selected.

## 6. Data and integration flow

1. A buyer or seller opens the Marketplace Mini App through the marketplace bot.
2. The Mini App exchanges Telegram `initData` for an application access token, then sends that token with API requests.
3. The backend validates `initData` during the exchange, checks authorization on API requests, validates submitted data, and reads or writes PostgreSQL records through Prisma ORM 7.
4. For an admin action, the Admin Mini App sends the request through the same backend; the backend verifies admin permissions before accessing metrics or listings.
5. The backend accepts listing images up to 5 MB each, validates and compresses them, then stores their bytes in PostgreSQL alongside listing metadata.
6. Bot interactions and Telegram notifications are handled by the same Node.js backend service.

## 7. Cross-cutting requirements

- **Authentication and authorization:** Validate Telegram `initData` on the backend. Enforce seller ownership and admin permissions server-side on every protected operation.
- **Validation and data integrity:** Treat Mini App input as untrusted. Validate listing fields, image references, and all state transitions on the backend; enforce critical invariants in PostgreSQL where appropriate.
- **Errors and logging:** Return clear errors to clients. Never log bot tokens, credentials, or raw authentication data.
- **API rate limiting:** The initial Express process limit is 100 requests per client IP per 60 seconds (`RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`), returning the API `429` error shape. It is in-memory per process; revisit limits and configure trusted proxy handling for the selected production host before release.
- **Configuration and secrets:** Supply bot tokens, database credentials, and other environment-specific values through deployment secrets; do not commit real values.
- **Marketplace bot launch:** `/start` and `/app` return an inline button that opens the configured Marketplace Mini App. Bot startup is disabled by default so local API development does not require Telegram credentials.
- **Background work and external services:** No external image storage service is used in v1. Compress listing images and enforce the 5 MB per-image upload limit.

## 8. Open technical questions

- **Hosting / deployment:** Deferred for now. The free-tier constraint in `PRD.md` applies when deployment is selected.
