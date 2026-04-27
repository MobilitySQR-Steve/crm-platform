# CRM API — Python / Django

Python rewrite of the original Node/Fastify backend in `../api/`. Built for
hand-off to the in-house Python team and AWS deployment alongside other
Python tools.

> **Status: Commit 1 of 4** — project skeleton, models, Django Admin. CRUD
> endpoints come in Commit 2; AI services in Commit 3; deploy/cron in Commit 4.
> The Node backend in `../api/` is still the canonical live service. Don't
> point the React frontend here yet.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Django 5.1 | Standard for Python service teams; ships with admin UI, ORM, migrations, sessions, auth |
| API | Django REST Framework | Most widely-known DRF flavor; serializers + viewsets are familiar to any Python dev |
| ORM | Django ORM | First-party; migrations are tracked in `*/migrations/`; `psycopg[binary]` driver |
| Auth | Django built-in session auth | Same security model as the TS backend (HttpOnly session cookies); plays nicely with the React SPA via CORS + `credentials: 'include'` |
| Password hashing | argon2-cffi (`Argon2PasswordHasher` first in `PASSWORD_HASHERS`) | Matches the TS backend's argon2id / OWASP 2026 params |
| LLM SDK | `anthropic` Python SDK | Drop-in for the TS SDK calls in the enrichment + outreach modules (Commit 3) |
| Rate limiting | `django-ratelimit` | Simple `@ratelimit` decorator on auth views |
| CORS | `django-cors-headers` | Standard middleware; origin allowlist via `CORS_ALLOWED_ORIGINS` |
| Local dev DB | SQLite | No setup. Production uses Postgres via `DATABASE_URL`. |
| Production server | gunicorn | Standard WSGI server; ECS / Beanstalk / EC2 friendly |

## Project layout

```
api-py/
├── manage.py
├── requirements.txt
├── .env.example                # copy to .env for local dev
├── crm_project/                # Django project (settings, root URLs, WSGI)
│   ├── settings.py
│   ├── urls.py
│   ├── exceptions.py           # uniform DRF error envelope { error, message?, details? }
│   └── wsgi.py / asgi.py
├── users/                      # custom User model (email is USERNAME_FIELD)
│   ├── models.py               # User + UserRole TextChoices
│   ├── managers.py             # UserManager (create_user, create_superuser)
│   ├── admin.py                # Django Admin registration
│   └── migrations/
└── crm/                        # CRM domain models
    ├── models.py               # Account, Contact, Opportunity, Activity, EnrichmentRun + enums
    ├── admin.py
    └── migrations/
```

Commits 2–4 will add:
- `users/views.py` + `users/urls.py` + `users/serializers.py` — auth views
- `crm/views.py` + `crm/urls.py` + `crm/serializers.py` — CRUD endpoints
- `ai/` app — enrichment / sourcing / outreach services + endpoints
- `crm/management/commands/morning_cron.py` — daily cron
- `Dockerfile` + AWS deploy notes

## Local dev

```bash
cd api-py

# 1. Create venv + install deps (one-time)
python3.12 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r requirements.txt

# 2. Configure env
cp .env.example .env
# Leave DATABASE_URL blank to use local SQLite (db.sqlite3 at repo root).
# Set ANTHROPIC_API_KEY when you reach Commit 3.

# 3. Apply migrations + create superuser
.venv/bin/python manage.py migrate
.venv/bin/python manage.py createsuperuser \
    --email steve@example.com --first_name Steve --last_name W.

# 4. Run the dev server
.venv/bin/python manage.py runserver 4001
```

Smoke checks:
- `curl http://localhost:4001/health` → `{"status": "ok"}`
- `curl http://localhost:4001/health/db` → `{"status": "ok", "db": "reachable"}`
- `http://localhost:4001/admin/` → Django Admin login page

## Conventions

- **snake_case fields**. The Prisma schema used camelCase (`lastEnrichedAt`,
  `crossBorderMovesBand`) — those tables are NOT reused. Django creates
  fresh tables with snake_case columns.
- **String enums**. Every enum is a `TextChoices` subclass whose values
  exactly match the TS Prisma enum strings (`B_700_1000`, `CLOSED_WON`,
  `ECONOMIC_BUYER`, etc.) so the React frontend's `src/constants/enums.js`
  works without changes.
- **Uniform error envelope**. `crm_project/exceptions.py` reshapes DRF's
  default error responses to `{"error": "<code>", "message"?: "...",
  "details"?: {...}}`. The frontend's `ApiError` class already parses this.
- **Django Admin enabled** for every model. Tech team gets a free CRUD UI
  for ops without writing any custom views.

## Production deploy (preview — full guide in Commit 4)

The intended deploy shape on AWS:

1. Container image (`Dockerfile`, Commit 4) → ECR
2. ECS Fargate or Elastic Beanstalk runs the container under gunicorn
3. Postgres on RDS (set `DATABASE_URL`)
4. Secrets in AWS Secrets Manager → injected as env vars: `DJANGO_SECRET_KEY`,
   `DATABASE_URL`, `ANTHROPIC_API_KEY`
5. Application Load Balancer in front (sets `X-Forwarded-Proto`; settings.py
   already trusts that header)
6. CloudFront / S3 hosts the React SPA; `VITE_API_URL` points at the ALB
7. Daily cron via EventBridge → Lambda or ECS RunTask invokes the
   `morning_cron` management command

A reference Dockerfile + sample `task-definition.json` + IAM policy hints
land in Commit 4.

## Reference: original TS backend

The Node/TypeScript backend in `../api/` is the live service. Until this
Django port reaches Commit 4 and is verified end-to-end, treat it as the
source of truth for endpoint contracts. Specifically: response shapes, status
codes, cookie attributes, and CORS behavior. Each Commit-2 endpoint will
match the TS counterpart byte-for-byte.
