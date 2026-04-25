# CRM API

Fastify + Prisma + Postgres backend for the CRM platform.

## Local dev

Prereqs: Docker Desktop or OrbStack (Postgres runs in a container).

```bash
# from repo root
npm install                    # installs root + api workspace
npm run db:up                  # start Postgres on :5432
cp api/.env.example api/.env
npm run db:migrate             # create tables
npm run db:seed                # seed Steve + 3 sample accounts
npm run api:dev                # Fastify on :4000
```

Sanity check:
```bash
curl http://localhost:4000/health     # { status: "ok", uptime: ... }
curl http://localhost:4000/health/db  # { status: "ok", db: "reachable" }
```

## Models

See `prisma/schema.prisma`.

- **User** — auth subject; owns Accounts/Opportunities/Activities
- **Account** — companies in the pipeline (the 12 CRM fields plus enrichment metadata)
- **Contact** — people at an Account, tagged by persona (CHAMPION, ECONOMIC_BUYER, etc.)
- **Opportunity** — a deal cycle for an Account; carries the kanban stage
- **Activity** — timeline entries (calls, emails, meetings, notes, system events)
- **EnrichmentRun** — audit trail for every enrich/source attempt by the morning job

## Scripts

| From repo root | What it does |
|---|---|
| `npm run db:up` / `db:down` / `db:logs` | Manage the Postgres container |
| `npm run db:migrate` | Apply Prisma migrations (dev) |
| `npm run db:seed` | Re-run seed script (idempotent) |
| `npm run db:reset` | Drop + re-create + seed (destructive) |
| `npm run db:studio` | Prisma Studio at :5555 |
| `npm run api:dev` | Fastify with watch mode |
| `npm run api:build` / `api:start` | Production build + run |
