# Near Market

Near Market is a Telegram Mini App marketplace for new and used items and whole-house rentals. Buyers browse listings and contact sellers directly on Telegram.

## Planned stack

- React, TypeScript, Vite, and Tailwind CSS
- Node.js, TypeScript, Express, and Telegraf
- PostgreSQL with Prisma ORM

## Documentation

- [Product requirements](docs/PRD.md)
- [Application flow](docs/APP_FLOW.md)
- [Design](docs/DESIGN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database schema](docs/SCHEMA.md)
- [API contract](docs/API.md)
- [Implementation tasks](docs/TASKS.md)

## Local API development

Install dependencies from the repository root with `npm install`, then copy `.env.example` to `.env`. Set `DATABASE_URL` to a local PostgreSQL database and `SESSION_SECRET` to at least 32 random bytes. To use Telegram session authentication, set a matching server-side bot token. The API can start without a bot token; only session creation requires one.

To run the marketplace bot, set `MARKETPLACE_BOT_ENABLED=true`, `MARKETPLACE_BOT_TOKEN`, and `MARKETPLACE_MINI_APP_URL` to an HTTPS URL reachable from Telegram. The bot's `/start` and `/app` commands show a button that opens that Mini App. Bot startup is disabled by default, so local API work does not contact Telegram.

Generate the Prisma Client and apply database migrations:

```sh
npm run db:generate --workspace=@near-market/server
npm run db:migrate --workspace=@near-market/server
npm run test:db --workspace=@near-market/server
```

Use a dedicated local test database for `test:db`; the integration tests roll back their changes. Run the API with `npm run dev --workspace=@near-market/server`. The health endpoint is available at `http://localhost:3000/health`.
