# Architecture Guide

> **Document purpose:** This document describes the system architecture, design decisions, data flow, scalability model, and **business value proposition** for the JobMatch platform. It is the single source of truth for how the system works end-to-end.
>
> **Audience:** Senior engineers, new team members, architecture reviewers, stakeholders.
>
> **Last updated:** 2026-07-28

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Monorepo Structure](#monorepo-structure)
4. [Layer Architecture](#layer-architecture)
5. [Data Flow](#data-flow)
6. [Authentication & Authorization](#authentication--authorization)
7. [Database Schema & Indexing Strategy](#database-schema--indexing-strategy)
8. [Real-Time Communication](#real-time-communication)
9. [Monetization Model](#monetization-model)
10. [Scalability & Performance](#scalability--performance)
11. [Security Architecture](#security-architecture)
12. [Design Decisions](#design-decisions)

---

## System Overview

JobMatch is a **developer-first collaboration and job-matching platform** — a genuine alternative to LinkedIn's influencer-driven model.

### The Problem

LinkedIn has evolved into an influencer platform where reach = popularity, not ability. Developers build personal brands over genuine collaboration. Recruiters sift through noise instead of finding engineers who actually build and help others.

### The Solution

JobMatch rewards **collaboration, not influence**. It's a two-sided marketplace that connects job seekers and recruiters through authentic engineering engagement:

- **For Job Seekers:** Build real professional connections by helping others — share projects, discuss architecture, review code, give feedback. Get complete transparency on recruiter interest: see how many recruiters viewed your profile, what actions they took, and optimize your profile accordingly. Network with peers who actually build things, not just broadcast.

- **For Recruiters:** Find developers who don't just build — they **collaborate**. The platform surfaces candidates by their genuine contributions (helping others, project quality, technical depth), not follower counts. Get accurate talent matching based on real skills and community engagement.

**Business Model:**
- **Job Seekers:** Free (core networking + job applications)
- **Recruiters:** Free tier with paid job boosts for emergency hiring + featured listings for premium visibility
- **Revenue drivers:** Job boosts, featured listings, referral fees

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                        FRONTEND                          │
│                    React 18 SPA (Vite)                    │
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Router  │  │  Zustand │  │ TanStack │  │  Socket  │ │
│  │(react-   │  │  Stores  │  │  Query   │  │  Client  │ │
│  │router-dom│  │ (auth,ui)│  │ (cache)  │  │(io-client)│ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│         │            │             │             │        │
│         ▼            ▼             ▼             ▼        │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Axios HTTP Client (lib/api.ts)         │  │
│  │  - Base URL: VITE_API_URL                           │  │
│  │  - Auth interceptor (Bearer token injection)        │  │
│  │  - Refresh interceptor (transparent token rotation) │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────────┬────────────────────────────────┘
                           │ HTTP (REST)
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    API GATEWAY (Vercel)                   │
│                Express.js + Helmet + CORS                 │
│                                                           │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐│
│  │ Rate Limit │  │  Auth      │  │  Validation (Zod)    ││
│  │(express-   │  │(Passport + │  │  Middleware           ││
│  │rate-limit) │  │ JWT)       │  │  (per-route schemas)  ││
│  └────────────┘  └────────────┘  └──────────────────────┘│
│         │              │                    │             │
│         ▼              ▼                    ▼             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │             Route Layer (routes/*.ts)                │  │
│  │  auth │ posts │ jobs │ users │ applications │ ...    │  │
│  └─────────────────────┬───────────────────────────────┘  │
│                        ▼                                   │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Controller Layer (controllers/*.ts)          │  │
│  │  Request parsing → validation → service call → resp  │  │
│  └─────────────────────┬───────────────────────────────┘  │
│                        ▼                                   │
│  ┌─────────────────────────────────────────────────────┐  │
│  │          Service Layer (services/*.ts)               │  │
│  │  All business logic lives here. No HTTP knowledge.  │  │
│  │  Calls Prisma ORM for data access.                  │  │
│  └─────────────────────┬───────────────────────────────┘  │
│                        ▼                                   │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                 Prisma ORM Layer                      │  │
│  │  Type-safe queries → connection pooling → PostgreSQL │  │
│  └─────────────────────┬───────────────────────────────┘  │
└──────────────────────────┬────────────────────────────────┘
                           │ SQL
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    PostgreSQL 15                          │
│  - Primary database (all transactional data)              │
│  - Hosted on Vercel Postgres or Supabase                  │
│  - Connection pooling via PgBouncer                       │
└─────────────────────────────────────────────────────────┘

External Services:
  ┌──────────────────────┐  ┌──────────────────────┐
  │     Socket.io        │  │  (Future) Stripe +   │
  │  (real-time events)  │  │  Cloudinary for      │
  │                      │  │  payments & media    │
  └──────────────────────┘  └──────────────────────┘
```

---

## Monorepo Structure

```
job-matching/
├── .github/workflows/    # CI/CD pipeline definitions
├── apps/
│   ├── web/              # React 18 SPA (Vite, Tailwind, TypeScript)
│   │   ├── src/
│   │   │   ├── pages/    # Page-level components
│   │   │   ├── components/ # Reusable UI (ui/, layout/, feed/, jobs/, common/)
│   │   │   ├── hooks/    # Custom React hooks (useAuth, usePosts, etc.)
│   │   │   ├── stores/   # Zustand state (authStore, uiStore)
│   │   │   ├── lib/      # Axios client, utilities, constants
│   │   │   ├── routes/   # React Router definitions
│   │   │   ├── styles
│   │   │   └── types
│   │   └── vercel.json   # Vercel deployment config
│   │
│   └── api/              # Express.js REST API (TypeScript)
│       ├── src/
│       │   ├── server.ts # Entry point (HTTP + Socket.io bootstrap)
│       │   ├── app.ts    # Express middleware stack
│       │   ├── config/   # Environment, DB connection
│       │   ├── routes/   # 16 route modules
│       │   ├── controllers/ # Request handlers (thin)
│       │   ├── services/ # Business logic (thick)
│       │   ├── middleware/ # Auth, validation, error, rate-limit
│       │   └── utils/    # Logger, helpers
│       ├── prisma/       # Schema + migrations
│
├── packages/
│   └── shared/           # Shared Zod schemas + TypeScript types
│       ├── schemas/      # Validation schemas (auth, job, post, user)
│       └── types/        # Shared interfaces
│
├── docs/                 # Enterprise documentation
├── docker-compose.yml    # Local PostgreSQL
└── package.json          # Root workspace config
```

**Workspace dependency graph:**
```
@jobmatch/shared  ←  apps/web
@jobmatch/shared  ←  apps/api
```

---

## Layer Architecture

### Route Layer (`routes/*.ts`)
- Defines HTTP methods, paths, and middleware chains
- Validates request shape via Zod schema middleware
- Delegates to controllers
- No business logic

### Controller Layer (`controllers/*.ts`)
- Extracts validated data from `req`
- Calls service methods
- Formats HTTP response
- Catches errors and passes to error middleware
- No business logic

### Service Layer (`services/*.ts`)
- All business logic
- Orchestrates Prisma queries and external API calls
- Throws typed `AppError` instances
- No HTTP knowledge (no `req`, `res`)

### Middleware Chain
```
Request → rateLimiter → helmet → cors → passport → bodyParser
       → validate(schema) → auth ← → controller → errorHandler
```

---

## Data Flow

### Typical Request Lifecycle

```
1. User clicks "Apply for Job"
2. React Router navigates to /jobs/:id
3. TanStack Query fires GET /api/v1/jobs/:id
4. Axios interceptor attaches Bearer token from authStore
5. Express validates JWT via Passport (auth middleware)
6. Route rate-limiter checks window (100 req/min default)
7. Zod validation middleware checks query params
8. Controller extracts params, calls jobService.getJobById()
9. Service runs Prisma query: findUnique with includes
10. Prisma returns typed result → formatted → returned
11. Response flows back: controller → Express → Axios → TanStack cache → UI re-render
```

### Authentication Flow

```
Login:
  POST /auth/login { email, password }
    → authService.login()
      → bcrypt.compare(password, hash)
      → generateAccessToken() (JWT, 15m expiry)
      → generateRefreshToken() (JWT, 7d expiry)
      → save session to DB
    → Returns { accessToken, refreshToken, user }

  Client stores:
    - accessToken: Zustand (in-memory, lost on refresh → use refreshToken)
    - refreshToken: Zustand (persisted to localStorage)

  On 401:
    Axios interceptor catches → POST /auth/refresh { refreshToken }
      → Verify refresh token → issue new access token
    → Retry original request with new token
```

---

## Authentication & Authorization

### Strategy
- **Access tokens:** Short-lived JWT (15 min default) in memory + Bearer header
- **Refresh tokens:** Longer-lived JWT (7 days) for transparent rotation
- **Sessions:** Stored in `Session` table for revocation capability

### Role-Based Access Control

| Role | Capabilities |
|------|-------------|
| `SEEKER` | Browse jobs, apply, create posts, like/comment, follow users |
| `RECRUITER` | Post jobs, manage applications, shortlist candidates, access analytics, company profile |
| `ADMIN` | Moderate users/posts, view platform analytics, manage roles |

### Plan-Based Gating

The `subscription.middleware.ts` enforces plan limits:
- `checkPlanLimit(field, maxField)` — checks usage vs max
- Used for: `activeJobsUsed/maxActiveJobs`, `maxCandidateViews`
- Returns 403 with `PLAN_LIMIT_REACHED` when exceeded

**Tier comparison:**

| Feature | Free | Pro ($29/mo) |
|---------|------|--------------|
| Active jobs | 1 | Unlimited |
| Applicants per job | 10 | Unlimited |
| Candidate profile views | 10 | Unlimited |
| Shortlist saves | 10 | Unlimited |
| Private notes | ❌ | ✅ |
| CSV export | ❌ | ✅ |
| Company profile | ❌ | ✅ |
| Smart match alerts | ❌ | ✅ |

---

## Database Schema & Indexing Strategy

### Key Models

| Model | Purpose | Key Indexes |
|-------|---------|-------------|
| `User` | Auth + roles | `email` (unique) |
| `Profile` | Extended user data | `userId` (unique) |
| `Post` | Social feed content | `createdAt`, `authorId`, `category` |
| `Like` | Post engagement | `(postId, userId)` unique |
| `JobListing` | Job posts | `status`, `createdAt`, `(type, level)` |
| `Application` | Job applications | `(jobId, applicantId)` unique |
| `Notification` | User notifications | `(userId, read)` |
| `CandidateShortlist` | Recruiter saves | `(recruiterId, candidateId)` unique |
| `CompanyProfile` | Employer brand | `recruiterId` unique |
| `ActivityLog` | Profile view tracking | `(targetId, createdAt)`, `viewerId` |

### Indexing Strategy

- **Composite unique indexes** enforce business constraints (one application per job, one like per post)
- **Compound indexes** for common query patterns (`(userId, read)` for unread notification count)
- **Sort indexes** on frequently ordered columns (`createdAt`, `communityScore`)
- **Enum indexes** for status filtering (`status`, `type`, `level`)
- All **foreign keys** are implicitly indexed via `@relation`

---

## Real-Time Communication

Socket.io server initializes in `server.ts` and provides:
- **Room-based messaging:** Each user joins `user:{userId}` room on connection
- **Events:** Notifications pushed in real-time when matches, applications, or interactions occur
- **No persistent state:** Socket.io is pure event relay — all data is in PostgreSQL

---

## Monetization Model

### Revenue Streams

1. **Job boosts** ($9 standard / $19 urgent) — Emergency hiring acceleration
2. **Featured jobs** — Premium visibility for critical roles
3. **Referral fees** (10% platform cut on successful referral payouts)
4. **Future:** Recruiter Pro subscriptions, Seeker Premium (profile badges, advanced analytics)

### Implementation Status

| Service | File | Status |
|---------|------|--------|
| `boost.service.ts` | Job boost purchasing, expiry handling | Implemented (manual, no payment gateway) |
| `payout.service.ts` | Referral payout processing | Planned |
| `insights.service.ts` | Revenue analytics dashboard | Planned |
| `subscription.middleware.ts` | Plan limit enforcement | Implemented (flag-based) |

> **Note:** Stripe payment integration is **planned for production launch**. Currently, job boosts and plan upgrades are processed manually via database flags. Cloudinary media storage is also a future integration — current file uploads use direct URL storage.

---

## Scalability & Performance

### Current Architecture
- **Stateless API:** All session state in DB, horizontal scale by adding instances
- **Connection pooling:** Prisma manages PostgreSQL connection pool
- **Rate limiting:** In-memory (per-instance), upgrade to Redis-based for multi-instance

### Bottlenecks
- **Talent matching:** Current algorithm loads all seekers into memory (`O(n)` scan). At scale, switch to PostgreSQL full-text search or vector embeddings.
- **Feed generation:** Simple time-based sort per user. At scale, implement fan-out-on-write or materialized feeds.

### Future Optimizations *(add when throughput demands)*

| Bottleneck | Solution | Trigger |
|------------|----------|---------|
| Talent pool scan | PostgreSQL `tsvector` + GIN index | >10k seekers |
| Feed queries | Redis-based fan-out feed | >1k feed renders/sec |
| Rate limiting | Redis-backed distributed limiter | >1 API instance |
| File uploads | Cloudinary integration (direct upload) | Production launch |
| Notification push | Dedicated notification worker (Bull + Redis) | >100 notifications/sec |
| Payments | Stripe integration | Production launch |

---

## Security Architecture

### Layers

1. **Transport:** HTTPS enforced in production (terminated by Vercel edge network)
2. **Headers:** Helmet.js (XSS, CSP, clickjacking, MIME sniffing)
3. **CORS:** Explicit origin whitelist (`env.CORS_ORIGIN`)
4. **Rate limiting:** 100 req/min per IP (configurable)
5. **Auth:** JWT with short expiry + refresh rotation
6. **Validation:** Zod schemas validated at middleware level
7. **Database:** Parameterized queries via Prisma (no SQL injection)
8. **Passwords:** bcrypt with cost factor 10+
9. **File uploads:** URL-based storage (Cloudinary integration planned for production)

### Security Checklist

- [ ] No hardcoded secrets (all via env vars)
- [ ] Rate limiting on auth routes (prevent brute force)
- [ ] Input validation on every mutation endpoint
- [ ] SQL injection impossible (Prisma parameterized queries)
- [ ] XSS prevented (Helmet CSP headers)
- [ ] CORS locked to production frontend domain
- [ ] No sensitive data in error responses (production mode)
- [ ] File uploads validated for type and size

---

## Design Decisions

### Why Express.js over Next.js / Fastify?
- **Decision:** Express 4.x
- **Rationale:** The API has distinct concerns (REST + Socket.io) that don't benefit from Next.js file-system routing. Express gives explicit control over middleware ordering, which matters for Socket.io co-hosting and multi-role auth flows.
- **Tradeoff:** More boilerplate per route. Accepted because route patterns are uniform and extractable.

### Why monorepo (npm workspaces) over separate repos?
- **Decision:** npm workspaces monorepo
- **Rationale:** Shared Zod schemas must be identical between frontend and backend. A monorepo guarantees schema version lockstep without publishing packages.
- **Tradeoff:** Larger clone, coupled CI. Accepted because the team is small.

### Why Prisma over Drizzle / TypeORM?
- **Decision:** Prisma 5.x
- **Rationale:** Best-in-class migration tooling, generated types flow directly into service layer, Prisma Studio for ad-hoc queries.
- **Tradeoff:** Heavier client binary, slower compile. Accepted in favor of developer experience.

### Why Zustand over Redux / Context?
- **Decision:** Zustand 4.x
- **Rationale:** Minimal boilerplate, no providers needed, built-in middleware for persistence, tiny bundle size (1KB).
- **Tradeoff:** No devtools middleware ecosystem. Accepted — auth state is small.

### Why TanStack Query over SWR / RTK Query?
- **Decision:** TanStack Query 5.x
- **Rationale:** Best cache invalidation model, window-focus refetching, mutation optimistic updates, devtools.
- **Tradeoff:** Larger bundle than SWR. Accepted — the cache layer is critical.

### Why socket.io over SSE / WebSocket?
- **Decision:** Socket.io 4.x
- **Rationale:** Automatic reconnection, room support, fallback transports, works behind proxies.
- **Tradeoff:** Heavier protocol overhead. Accepted — real-time is not throughput-critical.

---

## Related Documents

| Document | Location | Purpose |
|----------|----------|---------|
| API Reference | [`API.md`](./API.md) | Complete endpoint documentation |
| Deployment Guide | [`DEPLOYMENT.md`](./DEPLOYMENT.md) | CI/CD pipeline, Vercel setup |
| Contributing | [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Development workflow, PR process |
| Security | [`SECURITY.md`](./SECURITY.md) | Vulnerability reporting, security policy |
| Changelog | [`CHANGELOG.md`](./CHANGELOG.md) | Version history |
| README | [`../README.md`](../README.md) | Project overview, quick start |
