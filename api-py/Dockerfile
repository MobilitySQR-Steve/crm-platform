# Multi-stage Docker build for the Django API + cron service.
# Build context is the api-py/ directory.
#
# Build:        docker build -t crm-api -f Dockerfile .
# Run web:      docker run --env-file .env -p 8000:8000 crm-api
# Run cron:     docker run --env-file .env crm-api python manage.py morning_cron
#
# In production on AWS:
#   - Push the image to ECR
#   - Run as ECS Fargate task (web) + scheduled EventBridge rule (cron)
#   - DATABASE_URL points at RDS Postgres
#   - Secrets injected via AWS Secrets Manager

# ── Build stage — installs deps into a virtualenv we copy out ───
FROM python:3.12-slim-bookworm AS build

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app

# Build deps for psycopg + argon2-cffi (need libpq + a C compiler).
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install into an isolated virtualenv we'll copy into the runtime image.
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# ── Runtime stage — slim image with venv + app code ──────────────
FROM python:3.12-slim-bookworm AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    DJANGO_SETTINGS_MODULE=crm_project.settings \
    PORT=8000

WORKDIR /app

# Runtime libs only — psycopg needs libpq at run time, OpenSSL too.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /opt/venv /opt/venv
COPY . .

# Run as a non-root user.
RUN useradd --system --create-home --uid 1001 appuser \
    && chown -R appuser:appuser /app
USER appuser

# Collect static files (Django Admin assets) so the production server
# can serve them (or so they can be uploaded to S3 + CloudFront).
RUN python manage.py collectstatic --noinput || true

EXPOSE 8000

# Default command — overridden by the cron service / EventBridge rule.
# 4 workers × 2 threads is a reasonable Fargate small starting point.
CMD ["gunicorn", "crm_project.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--threads", "2", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
