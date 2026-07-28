# Contributing Guide

> **Document purpose:** Standards and workflow for contributing to the JobMatch platform. Every contributor must follow this guide.
>
> **Audience:** All developers contributing to the codebase.
>
> **Last updated:** 2026-07-27

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Development Workflow](#development-workflow)
3. [Branch Strategy](#branch-strategy)
4. [Commit Conventions](#commit-conventions)
5. [Pull Request Process](#pull-request-process)
6. [Code Review Standards](#code-review-standards)
7. [Testing Requirements](#testing-requirements)
8. [Documentation Requirements](#documentation-requirements)
9. [Environment Setup](#environment-setup)

---

## Code of Conduct

This project follows a **no-asshole policy**. Be respectful, constructive, and assume good faith. Personal attacks, trolling, and dismissive behavior are not tolerated.

---

## Development Workflow

```
1. Pull latest develop branch
2. Create feature branch from develop
3. Write code + tests
4. Run typecheck && build locally
5. Push branch
6. Create PR → CI validates
7. Code review → address feedback
8. Merge to develop
9. Release to main via PR
```

---

## Branch Strategy

```
main         ← Production. Protected. Only merge from develop.
  ↑
develop      ← Integration. All features merge here first.
  ↑
feat/*       ← New features. Branch from develop, merge back.
fix/*        ← Bug fixes. Branch from develop, merge back.
docs/*       ← Documentation changes.
chore/*      ← Build, CI, dependency updates.
```

### Branch Naming

```
feat/short-description    # New feature
fix/issue-number          # Bug fix
docs/what-changed         # Documentation
chore/what-changed        # Maintenance
```

Example: `feat/csv-export`, `fix/auth-refresh-race`, `docs/api-endpoints`

---

## Commit Conventions

This project uses **Conventional Commits**. Every commit message must follow:

```
<type>: <description>

[optional body]
```

### Types

| Type | When to Use | Example |
|------|-------------|---------|
| `feat` | New feature | `feat: add CSV export for shortlisted candidates` |
| `fix` | Bug fix | `fix: handle token refresh race condition` |
| `docs` | Documentation | `docs: add API reference for shortlist endpoints` |
| `refactor` | Code change, no behavior change | `refactor: extract talent matching algorithm` |
| `perf` | Performance improvement | `perf: add index on application status query` |
| `test` | Adding/updating tests | `test: add unit tests for talent matching` |
| `chore` | Build, CI, deps | `chore: update prisma to 5.22` |
| `ci` | CI/CD changes | `ci: add deploy workflow for vercel` |
| `style` | Formatting only | `style: fix indentation in job routes` |

### Good Commit Messages

```
feat: add experience-level filter to applicant pipeline

Recruiters can now filter applicants by estimated experience level
(Junior/Mid/Senior/Lead) in the pipeline view. Level is computed
from the candidate's profile.experience JSON dates.

Closes #42
```

### Bad Commit Messages
```
fix bug                    # Too vague, no context
wip                        # Incomplete, no value
asdf                       # Useless
Update file.ts             # Doesn't say what or why
```

---

## Pull Request Process

### Creating a PR

1. Ensure all CI checks pass (typecheck + build)
2. Write a descriptive title following commit conventions
3. Fill out the PR template with:
   - **What** changed
   - **Why** it changed
   - **How** to test
   - **Screenshots** (if UI change)
   - **Breaking changes** (if any)

### PR Title Format
```
feat: add experience-level filter to applicant pipeline
```

### PR Body Template
```markdown
## What
Brief description of the change.

## Why
Link to issue or business justification.

## How to Test
1. Log in as a recruiter
2. Go to job applications
3. Select "Senior" from level dropdown
4. Verify only Senior-level applicants shown

## Screenshots
[if applicable]

## Breaking Changes
None

Closes #42
```

### Review Requirements

- At least **one approval** from a maintainer
- All **CI checks must pass**
- No **CRITICAL** or **HIGH** review findings unresolved
- Code reviewed by `code-reviewer` agent before asking for human review

---

## Code Review Standards

### Review Checklist

- [ ] Code follows project style (TypeScript strict, no `any`)
- [ ] Functions are focused (<50 lines)
- [ ] Files are cohesive (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Errors handled explicitly
- [ ] Input validated at trust boundaries (Zod schemas)
- [ ] No hardcoded secrets
- [ ] No `console.log` in production code
- [ ] New API endpoints have Zod validation
- [ ] Database queries have appropriate indexes
- [ ] UI has loading, empty, and error states

### Review Severity

| Level | Meaning | Action |
|-------|---------|--------|
| CRITICAL | Security vulnerability or data loss | **Block** — must fix before merge |
| HIGH | Bug or significant quality issue | **Warn** — should fix before merge |
| MEDIUM | Maintainability concern | **Info** — consider fixing |
| LOW | Style suggestion | **Note** — optional |

---

## Testing Requirements

### Minimum Coverage: 80%

Run before pushing:
```bash
# From root
npm run build          # TypeCheck + Build (CI does this)
```

### Test Types

| Type | Tool | What |
|------|------|------|
| Unit | Vitest | Functions, services, utilities |
| Integration | Vitest | API endpoints, database operations |
| E2E | Playwright | Critical user flows (auth, job apply, posts) |

### Writing Tests

- Follow AAA pattern (Arrange, Act, Assert)
- Name tests describing behavior, not implementation
- Test edge cases: empty states, errors, boundaries
- Mock external services (planned: Cloudinary for media, Stripe for payments)

---

## Documentation Requirements

### When to Update Docs

- **New feature** → Update API.md + README.md
- **Architecture change** → Update ARCHITECTURE.md
- **Deployment change** → Update DEPLOYMENT.md
- **Breaking API change** → Update API.md, add migration note
- **New env variable** → Update .env.example + DEPLOYMENT.md

### Documentation Standards

- Keep docs in `docs/` directory
- Markdown format with table of contents
- Include code examples for API endpoints
- Note any plan-gating (Free vs Pro)
- Every document must have: purpose statement, audience, last-updated date

---

## Environment Setup

### Quick Start

```bash
# Prerequisites: Node.js 20+, Docker

git clone https://github.com/yourusername/job-matching.git
cd job-matching
npm install
cp .env.example .env    # Edit .env with your values
docker-compose up -d db  # Start PostgreSQL
cd apps/api
npx prisma migrate dev --name init
npx prisma db seed
cd ../..
npm run dev              # Starts both frontend and backend
```

### Available Scripts

```bash
npm run dev              # Start both services in dev mode
npm run build            # Build all packages

# Per-app
cd apps/web && npm run dev    # Frontend only (port 5173)
cd apps/api && npm run dev    # Backend only (port 3001)

# Database
cd apps/api
npx prisma studio        # Open Prisma Studio (GUI DB browser)
npx prisma migrate dev   # Create migration after schema changes
npx prisma db seed       # Seed demo data
```

---

## License

This project is MIT licensed. By contributing, you agree that your contributions will be licensed under the same license.
