# Deployment Guide

Deploys the CRM as three services:

| Component | Host | Cost |
|---|---|---|
| Postgres database | Neon (already set up) | Free tier ok for now |
| Fastify API + morning cron | Render | ~$8–10 / month |
| React frontend | Vercel | Free hobby tier |
| Anthropic API (enrichment) | console.anthropic.com | ~$45 / month at 5+5 daily |

**Total: ~$55 / month** for everything running.

---

## Prereq: rotate the Anthropic API key

If the key in `api/.env` ever appeared in a chat transcript or elsewhere, **rotate it now** before deploying anywhere else can read it. https://console.anthropic.com/settings/keys → delete + create new.

---

## Step 1 — Backend on Render

The repo has `render.yaml` declaring two services (web API + morning cron) that share an env-var group.

1. Sign up at https://render.com (GitHub login is fastest).
2. Dashboard → **New** → **Blueprint** → connect this repo (`MobilitySQR-Steve/crm-platform`) → Render reads `render.yaml` and shows you the planned services. Click **Apply**.
3. Render prompts for the secrets in the `crm-shared` env group:
   - **DATABASE_URL**: copy from Neon dashboard → your project → Connection string. Use the **pooled** endpoint (`-pooler` in the host) for the web service; direct for migrations is fine since `prisma migrate deploy` runs in the build.
   - **ANTHROPIC_API_KEY**: paste your (just-rotated) key.
4. Render also prompts for `ALLOWED_ORIGIN` on the web service. **Leave it blank for now** — you'll fill it in after the frontend deploys (Step 3).
5. Click **Create Resources**. First build takes ~5 min (Docker layer cache will speed up subsequent ones).
6. When the web service is **Live**, copy its URL — looks like `https://crm-api-XXXX.onrender.com`. Save this.
7. Smoke test: `curl https://crm-api-XXXX.onrender.com/health` → should return `{"status":"ok",...}`.

The cron service deploys but sits idle until 07:00 UTC. To test it manually before then: Render dashboard → **crm-morning-cron** → **Run job manually**. First run will use ~$0.30 of API credits.

---

## Step 2 — Frontend on Vercel

The repo has `vercel.json` configuring the Vite build + SPA-routing rewrites.

1. Sign up at https://vercel.com (GitHub login).
2. **Add New** → **Project** → import this repo. Vercel detects Vite automatically.
3. Before clicking Deploy, expand **Environment Variables** and add:
   - `VITE_API_URL` = `https://crm-api-XXXX.onrender.com` (the URL from Step 1)
4. Click **Deploy**. Build takes ~30s.
5. Copy the deployed URL — looks like `https://crm-platform-XXXX.vercel.app`.

---

## Step 3 — Wire CORS on Render

Now that the frontend has a URL, tell the backend to accept requests from it.

1. Render dashboard → **crm-api** → **Environment** → set `ALLOWED_ORIGIN` to your Vercel URL exactly (no trailing slash). Example:
   ```
   https://crm-platform-XXXX.vercel.app
   ```
2. If you want preview deploys to also work, comma-separate:
   ```
   https://crm-platform-XXXX.vercel.app,https://crm-platform-git-main-USERNAME.vercel.app
   ```
3. Save → Render auto-redeploys (~2 min).

---

## Step 4 — Sanity test

1. Open the Vercel URL.
2. You'll bounce to `/login`.
3. Sign in as `steve@mobilitysqr.com` with the password from local seeding.
   - **If your Neon DB is the same one you've been using locally**, this works. If you started with a fresh production DB, run the seed manually first: in Render dashboard → **crm-api** → **Shell** → `npm run -w api db:seed` and grab the printed password.
4. Land on `/mobility/dashboard` — should show your real account count.
5. Pick an account → **Run enrichment** → should work end-to-end against the deployed Anthropic key.

If sign-in fails with a CORS error in the browser console, double-check `ALLOWED_ORIGIN` matches the Vercel URL exactly (https://, no trailing slash, correct subdomain).

---

## Operational notes

**Logs**: Render dashboard → service → Logs (live tail). The cron service shows a fresh log stream per run.

**Cron timing**: `render.yaml` schedules `"0 7 * * *"` (07:00 UTC). To shift to 7am Pacific, change to `"0 14 * * *"` (UTC). Edit, push, Render redeploys.

**Cost levers**: bump `MORNING_CRON_REENRICH` and `MORNING_CRON_SOURCE` in the cron service env vars. Each +1 = ~$0.10–0.30/day in API costs.

**Custom domain**: Render and Vercel both support custom domains under Settings → Custom Domains. CORS allowlist needs updating to include the new domain when you switch.

**Rolling secrets**: rotate `ANTHROPIC_API_KEY` quarterly or after any suspected exposure. Render env updates trigger a redeploy automatically.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Vercel deploy succeeds, login button does nothing | `VITE_API_URL` not set or wrong | Vercel → Settings → Env Vars → check `VITE_API_URL`, redeploy |
| Login fails with `Access-Control-Allow-Origin` error in console | `ALLOWED_ORIGIN` not set on Render | Step 3 above |
| Login succeeds but `/auth/me` returns 401 right after | Cookie blocked because `sameSite=none` requires HTTPS | Both services must be HTTPS — they are by default on Render/Vercel. If you're testing with a custom domain, check the cert. |
| First deploy fails with "Prisma engine not found" | Missing binary target | `api/prisma/schema.prisma` already includes `debian-openssl-3.0.x` — make sure no local change reverted it |
| Cron runs but no accounts appear | `DATABASE_URL` mismatch between web service and cron | Both pull from `crm-shared` env group — check it's set there, not on the individual service |
