# Deployment Guide

> **Document purpose:** End-to-end deployment procedures for the JobMatch platform: CI/CD pipeline setup, infrastructure provisioning, environment configuration, and runbooks for common operations.
>
> **Audience:** DevOps engineers, team leads, developers deploying the platform.
>
> **Last updated:** 2026-07-28

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Infrastructure Setup](#infrastructure-setup)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Deploying Frontend to Vercel](#deploying-frontend-to-vercel)
6. [Deploying Backend to Vercel](#deploying-backend-to-vercel)
7. [Database Migrations](#database-migrations)
8. [Environment Variables](#environment-variables)
9. [Monitoring & Health Checks](#monitoring--health-checks)
10. [Rollback Procedures](#rollback-procedures)
11. [Deployment Runbook](#deployment-runbook)

---

## Architecture Overview

```
┌──────────────────────────────────────────┐     ┌──────────────────┐
│              Vercel (Serverless)          │     │  Vercel Postgres │
│                                          │     │   or Supabase    │
│  ┌────────────────────┐                  │     │                  │
│  │  apps/web (React)  │  Static SPA      │     │  PostgreSQL 16   │
│  │  SPA + Assets      │                  │     │                  │
│  └────────┬───────────┘                  │     └────────▲─────────┘
│           │ HTTP REST                    │              │
│           ▼                              │              │
│  ┌────────────────────┐                  │              │
│  │  apps/api (Express)│  Serverless      │──────────────┘
│  │  REST + Socket.io  │  Functions       │     SQL via Prisma
│  └────────────────────┘                  │
└──────────────────────────────────────────┘

Future Integrations:
  - Cloudinary for media storage (images, resumes)
  - Stripe for payments (job boosts, featured listings)
```

**DNS:**
- Frontend: `https://your-app.vercel.app` (or custom domain)
- API: `https://jobmatch-api.vercel.app` (or custom domain)
- API Health: `https://jobmatch-api.vercel.app/api/v1/health`

---

## Prerequisites

### Accounts
- [GitHub](https://github.com) account with repo access
- [Vercel](https://vercel.com) account (free tier sufficient — both frontend and backend deploy here)

### Local Tools
```bash
node >= 20.x
npm >= 9.x
docker >= 24.x    # For local PostgreSQL
git >= 2.x
```

### GitHub Repository Setup
```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/job-matching.git
git push -u origin main
```

---

## Database Setup

### Step 1: PostgreSQL Database

**Option A — Vercel Postgres (recommended):**
1. Go to [Vercel Dashboard](https://vercel.com) → Storage → Create Database → Postgres
2. Select region closest to your users
3. Copy the `POSTGRES_URL` connection string
4. Add to your API project environment variables

**Option B — Supabase:**
1. Sign up at [Supabase](https://supabase.com)
2. Create a new project
3. Go to Project Settings → Database → Connection string
4. Copy connection string → set as `DATABASE_URL` and `DIRECT_URL` in Vercel

### Step 2: Future Integrations

The following services are **planned for production launch** but not currently configured:

| Service | Purpose | When |
|---------|---------|------|
| **Cloudinary** | Media storage (images, resumes) | Production launch |
| **Stripe** | Payment processing (job boosts, featured jobs) | Production launch |

---

## CI/CD Pipeline

### GitHub Actions Workflows

The project has two workflows in `.github/workflows/`:

#### CI Pipeline (`ci.yml`)
Triggers on push to `main`/`develop` and PRs to `main`.

```
push/PR → Checkout → Install deps → TypeCheck (shared, api, web)
                                                  ↓
                                             Build (api, web)
                                                  ↓
                                       Upload dist artifacts
```

**Runs in ~3-5 minutes. Validates:**
- TypeScript compilation (all three packages)
- Build output is valid

#### CD Pipeline (`deploy.yml`)
Triggers on push to `main` and manual dispatch.

```
push to main → Checkout → Install deps → Build all → Deploy to Vercel
                                                         ├──→ apps/web (static SPA)
                                                         └──→ apps/api (serverless functions)
```

**Unified deployment:** Both frontend and backend deploy to Vercel in a single workflow.

### Setting Up GitHub Secrets

Go to your repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Description | Where to Get |
|--------|-------------|-------------|
| `VERCEL_TOKEN` | Vercel API token | Vercel Dashboard → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel team ID | Vercel Dashboard → Settings → General |
| `VERCEL_PROJECT_ID_API` | Vercel project ID for API | `vercel project ls` or Vercel project settings |
| `VERCEL_PROJECT_ID_WEB` | Vercel project ID for web | `vercel project ls` or Vercel project settings |

**Optional environment variables** (can also use `vars`):

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Production API URL (e.g., `https://jobmatch-api.vercel.app/api/v1`) |
| `VITE_SOCKET_URL` | Production Socket.io URL (e.g., `https://jobmatch-api.vercel.app`) |

---

## Deploying Frontend to Vercel

### Option A: Via GitHub Actions (Recommended)

1. **Create a Vercel token:**
   - Go to [Vercel Tokens](https://vercel.com/account/tokens)
   - Create a new token (name: "GitHub Actions")
   - Copy token → save as `VERCEL_TOKEN` in GitHub Secrets

2. **Create Vercel project:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login
   vercel login

   # Link to project
   cd apps/web
   vercel link

   # Get project ID
   vercel project ls
   ```
   - Save `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` as GitHub Secrets

3. **Configure project in Vercel Dashboard:**
   - Framework Preset: **Vite**
   - Build Command: Override to `cd ../.. && npm ci && npm run build` (or rely on `vercel.json`)
   - Output Directory: `dist`
   - Install Command: `cd ../.. && npm ci`

4. **Set environment variables in Vercel:**
   - `VITE_API_URL`: `https://jobmatch-api.vercel.app/api/v1`
   - `VITE_SOCKET_URL`: `https://jobmatch-api.vercel.app`

5. **Push to `main`** → workflow triggers → deploys automatically.

### Option B: Manual via Vercel CLI

```bash
cd apps/web
vercel --prod
```

### Option C: Vercel Git Import

1. Go to [Vercel New Project](https://vercel.com/new)
2. Import your GitHub repo
3. Configure:
   - Root Directory: `apps/web`
   - Build: `npm run build`
   - Output: `dist`
4. Deploy

---

## Deploying Backend to Vercel

The API is deployed to Vercel as **serverless functions**. Each route file in `apps/api/src/routes/` becomes a separate serverless function entry point.

### Option A: Via GitHub Actions (Recommended)

1. **Create Vercel projects:**
   - Create one Vercel project for `apps/web` (frontend)
   - Create a separate Vercel project for `apps/api` (backend serverless functions)

2. **Configure Vercel API project:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login
   vercel login
   
   # Link API project
   cd apps/api
   vercel link
   ```

3. **Save project IDs as GitHub Secrets:**
   - `VERCEL_PROJECT_ID_API`: The API's Vercel project ID
   - `VERCEL_PROJECT_ID_WEB`: The frontend's Vercel project ID
   - `VERCEL_ORG_ID`: Your Vercel team ID

4. **Push to `main`** → workflow triggers → deploys both automatically.

### Option B: Manual via Vercel CLI

```bash
# Deploy API
cd apps/api
vercel --prod

# Deploy frontend
cd apps/web
vercel --prod
```

### Vercel API Configuration

**`apps/api/vercel.json`** controls the serverless function setup:
```json
{
  "buildCommand": "cd ../.. && npm ci && npm run build",
  "outputDirectory": "dist",
  "functions": {
    "api/**/*.js": {
      "memory": 512,
      "maxDuration": 30
    }
  }
}
```

**Environment variables to set in Vercel dashboard (API project):**

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | PostgreSQL connection string |
| `DIRECT_URL` | Direct DB URL (bypasses pooler for migrations) |
| `JWT_SECRET` | Generate via `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Generate via `openssl rand -hex 32` |
| `CORS_ORIGIN` | `https://your-app.vercel.app` |

### Important: Serverless Considerations

- **Socket.io:** Vercel serverless functions have a 10s cold start + 30s timeout. For real-time features, consider using a long-running server or a dedicated WebSocket provider.
- **File uploads:** Vercel serverless has a 4.5MB body limit. For resume uploads, integrate Cloudinary direct upload (future).
- **Database connections:** Use connection pooling (PgBouncer via Supabase) to avoid exhausting connections per serverless invocation.

---

## Database Migrations

### Initial Migration
```bash
cd apps/api

# Generate migration from schema
npx prisma migrate dev --name init
# This creates prisma/migrations/ directory

# Deploy migration in production
npx prisma migrate deploy
```

### Subsequent Migrations
```bash
# After schema changes
npx prisma migrate dev --name add_new_feature

# Commit the migration file
git add prisma/migrations/
git commit -m "feat: add migration for new feature"
git push
```

### Migration Strategy for Production

```
┌─────────────────────────────────────────────┐
│           Deployment Sequence                │
│                                              │
│ 1. Push migration file to main               │
│ 2. GitHub Actions runs CI (typecheck + build)│
│ 3. Vercel auto-deploys on push to main       │
│ 4. Start command: prisma migrate deploy      │
│    (applies any pending migrations)          │
│ 5. Server starts                             │
└─────────────────────────────────────────────┘
```

**⚠️ Critical rules:**
- Never run `prisma migrate dev` in production — use `prisma migrate deploy`
- Always test migrations locally first
- Back up the database before applying production migrations

---

## Environment Variables

### Complete Reference

| Variable | Required | Where | Description |
|----------|----------|-------|-------------|
| `DATABASE_URL` | ✅ | API Vercel | PostgreSQL connection string with pooler |
| `DIRECT_URL` | ✅ | API Vercel | Direct DB URL (bypasses pooler for migrations) |
| `JWT_SECRET` | ✅ | API Vercel | HMAC secret for access tokens |
| `JWT_REFRESH_SECRET` | ✅ | API Vercel | HMAC secret for refresh tokens |
| `JWT_ACCESS_EXPIRY` | ❌ | API Vercel | Access token TTL (default: `15m`) |
| `JWT_REFRESH_EXPIRY` | ❌ | API Vercel | Refresh token TTL (default: `7d`) |
| `CORS_ORIGIN` | ✅ | API Vercel | Allowed CORS origin (frontend Vercel URL) |
| `RATE_LIMIT_WINDOW` | ❌ | API Vercel | Rate limit window in ms (default: 60000) |
| `RATE_LIMIT_MAX` | ❌ | API Vercel | Max requests per window (default: 100) |
| `VITE_API_URL` | ✅ | Web Vercel | API base URL for Axios |
| `VITE_SOCKET_URL` | ❌ | Web Vercel | Socket.io server URL |

---

## Monitoring & Health Checks

### Health Endpoint
```
GET /api/v1/health
```
**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "message": "JobMatch API is running",
    "timestamp": "2026-07-27T12:00:00.000Z"
  }
}
```

Vercel automatically monitors this endpoint for health checks.

### Logging
- **API:** Structured JSON logging via Pino (`src/utils/logger.ts`)
- **Vercel:** Built-in logging in Vercel Dashboard for both frontend and backend

### Alerting
- Vercel sends deployment status notifications
- For production: integrate with Sentry or similar error tracking

---

## Rollback Procedures

### Frontend (Vercel)

**Immediate rollback:**
1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → Promote to Production

**Via Git revert:**
```bash
git revert HEAD --no-edit
git push origin main
# Pipeline re-deploys the previous version
```

### Backend (Vercel)

**Immediate rollback:**
1. Go to Vercel Dashboard → your API project → Deployments
2. Find the last working deployment
3. Click "..." → Promote to Production

**Via Git revert:**
```bash
git revert HEAD --no-edit
git push origin main
# Pipeline re-deploys the previous version
```

### Database
```bash
# Prisma migrations are reversible only if down() is defined
# Manual DB restore from backup:
pg_restore -h <host> -U <user> -d jobmatch <backup_file>
```

---

## Deployment Runbook

### Standard Deployment

**When:** A PR is merged to `main`

**What happens (automatically):**
1. GitHub Actions `deploy.yml` triggers
2. All packages build (shared → api → web)
3. Both `apps/web` and `apps/api` deploy to Vercel (~3 min total)

**Verify:**
```bash
# Check health endpoint
curl https://jobmatch-api.vercel.app/api/v1/health

# Check frontend loads
curl -I https://your-app.vercel.app
```

### Manual Deployment

**When:** You need to deploy without pushing to main

**How:**
1. Go to GitHub → Actions → "CD — Deploy to Vercel"
2. Click "Run workflow"
3. Select branch
4. Click "Run"

### First-Time Setup Checklist

- [ ] GitHub repo created and pushed
- [ ] GitHub Secrets configured (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID_API, VERCEL_PROJECT_ID_WEB)
- [ ] Vercel projects created and linked (one for `apps/web`, one for `apps/api`)
- [ ] PostgreSQL database created (Vercel Postgres or Supabase)
- [ ] Environment variables set in both Vercel projects
- [ ] `npx prisma migrate deploy` run against production DB
- [ ] CORS_ORIGIN updated to production frontend Vercel URL
- [ ] JWT secrets set in Vercel environment variables
- [ ] DNS configured (if using custom domains)

### Emergency Contacts

| Issue | Action | Who |
|-------|--------|-----|
| Service down | Restart via Vercel dashboard | On-call |
| DB corruption | Restore from backup | DevOps |
| Security incident | Rotate secrets, block access | Security lead |

---

## Related Documents

| Document | Location |
|----------|----------|
| Architecture | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| API Reference | [`API.md`](./API.md) |
| Contributing | [`CONTRIBUTING.md`](./CONTRIBUTING.md) |
| CI Workflow | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) |
| CD Workflow | [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) |
| Vercel Config (Web) | [`apps/web/vercel.json`](../apps/web/vercel.json) |
| Vercel Config (API) | [`apps/api/vercel.json`](../apps/api/vercel.json) |
