# Security Policy

> **Document purpose:** Security practices, vulnerability reporting, and incident response for the JobMatch platform.
>
> **Audience:** Security researchers, developers, maintainers.
>
> **Last updated:** 2026-07-27

---

## Table of Contents

1. [Supported Versions](#supported-versions)
2. [Reporting a Vulnerability](#reporting-a-vulnerability)
3. [Security Architecture](#security-architecture)
4. [Data Protection](#data-protection)
5. [Authentication & Authorization](#authentication--authorization)
6. [Dependency Management](#dependency-management)
7. [Secure Development Practices](#secure-development-practices)
8. [Incident Response](#incident-response)

---

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x (latest) | ✅ Active development |
| < 1.0 | ❌ Pre-release |

---

## Reporting a Vulnerability

**Do not** open a public GitHub issue for security vulnerabilities.

**Instead:**
1. Email the security team: [security@yourcompany.com]
2. Or open a draft security advisory: GitHub repo → Security → Advisories → New advisory

**Expect:**
- **Acknowledgment** within 48 hours
- **Assessment** within 5 business days
- **Fix timeline** communicated after assessment

**We will:**
- Confirm receipt within 48 hours
- Provide an estimated fix timeline
- Notify you when the fix is deployed
- Credit you in the release notes (unless you request anonymity)

---

## Security Architecture

### Transport Layer
- **HTTPS only** in production (terminated by Vercel edge network)
- **HSTS headers** set by Vercel edge network
- All API communication encrypted in transit

### Application Layer
- **Helmet.js** sets security headers (CSP, XSS, clickjacking, MIME sniffing)
- **CORS** locked to single production origin
- **Rate limiting** per IP (100 req/min, configurable)
- **Input validation** via Zod schemas on every endpoint

### Data Layer
- **Parameterized queries** via Prisma ORM (no SQL injection possible)
- **Password hashing** with bcrypt (cost factor 10)
- **JWT** with short-lived access tokens (15m) + refresh rotation
- **No sensitive data in logs** (Pino structured logging, no secrets)

---

## Data Protection

### What We Store

| Data | Where | Protected By |
|------|-------|-------------|
| Passwords | PostgreSQL (hashed) | bcrypt, cost 10 |
| JWT secrets | Environment variables | Vercel encrypted env vars |
| Email addresses | PostgreSQL | Encrypted at rest (RDS) |
| Profile data | PostgreSQL | Encrypted at rest |
| Files (images/resumes) | URL storage (Cloudinary planned for production) | Validated at upload |

### What We Do NOT Store
- API keys in source code
- Unencrypted secrets
- Credit card numbers (future Stripe integration will handle these directly)

### Data Retention
- User accounts: until deletion request
- Session tokens: 7 days (refresh token TTL)
- Activity logs: 90 days

---

## Authentication & Authorization

### JWT Token Security

```typescript
// Access token: short-lived, in-memory only
{
  sub: userId,
  role: "SEEKER" | "RECRUITER" | "ADMIN",
  exp: Math.floor(Date.now() / 1000) + 15 * 60  // 15 minutes
}

// Refresh token: longer-lived, stored in localStorage
{
  sub: userId,
  jti: uuid,              // Unique token ID for revocation
  exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60  // 7 days
}
```

### Security Measures

- **Never store access tokens in localStorage** (XSS vulnerable)
- **Refresh tokens** are single-use (rotated on each refresh)
- **Sessions** stored in DB for server-side revocation
- **Rate limiting** on auth endpoints (prevent brute force)
- **Password complexity** enforced via Zod validation

### Role Enforcement

```
Route → requireRole("RECRUITER") → next()
         ↓
  401 if not authenticated
  403 if wrong role
```

### Plan Limit Enforcement

```
Route → requireRole("RECRUITER") → checkPlanLimit("activeJobsUsed", "maxActiveJobs") → next()
         ↓
  403 PLAN_LIMIT_REACHED if exceeded
```

---

## Dependency Management

### Processes
- **Regular updates:** Dependencies reviewed monthly
- **Security patches:** Applied within 48 hours for critical CVEs
- **Automated scanning:** Dependabot enabled on GitHub

### Current Major Dependencies

| Package | Version | Risk Level | Notes |
|---------|---------|------------|-------|
| Express | 4.x | Low | Mature, well-maintained |
| Prisma | 5.x | Low | Type-safe, parameterized queries |
| Passport | 0.7 | Low | Standard auth middleware |
| Socket.io | 4.x | Low | WebSocket with fallback |
| Helmet | 7.x | Low | Security headers |
| bcrypt | 5.x | Low | Password hashing |
| jsonwebtoken | 9.x | Low | JWT implementation |
| Zod | 3.x | Low | Input validation |

### Supply Chain Security

- **npm audit** run in CI pipeline
- **Lockfile** (`package-lock.json`) committed to prevent dependency drift
- **No postinstall scripts** from external packages

---

## Secure Development Practices

### Mandatory Checks Before Every Commit

- [ ] No secrets in code (API keys, passwords, tokens)
- [ ] All user input validated (Zod schema)
- [ ] No SQL injection vectors (Prisma only)
- [ ] XSS prevented (React auto-escapes, CSP headers)
- [ ] CSRF protected (token-based auth, not cookie-based)
- [ ] Rate limiting on new endpoints
- [ ] Error messages don't leak sensitive data
- [ ] No `console.log` statements

### Code Review Security Checklist

For every PR, the reviewer checks:

1. **Data validation:** Are all inputs validated at the boundary?
2. **Authentication:** Are new routes properly protected?
3. **Authorization:** Are ownership/role checks in place?
4. **Error handling:** Do errors leak stack traces or DB details?
5. **File uploads:** Are files validated for type and size?
6. **Environment variables:** Are new secrets properly handled?

### What Never to Do

❌ Commit `.env` files  
❌ Hardcode API keys in source  
❌ Log passwords or tokens  
❌ Use `eval()` or dynamic `require()`  
❌ Trust user input without validation  
❌ Store plaintext passwords  

---

## Incident Response

### Severity Levels

| Severity | Definition | Response Time |
|----------|------------|--------------|
| **CRITICAL** | Data breach, auth bypass, RCE | Immediate |
| **HIGH** | Data corruption, privilege escalation | < 4 hours |
| **MEDIUM** | Information disclosure, CSRF | < 24 hours |
| **LOW** | Minor misconfiguration | < 1 week |

### Response Process

```
1. DETECT
   - Automated alert (Vercel deployment failure, unexpected error spike)
   - User report of suspicious activity
   - Security researcher disclosure

2. TRIAGE (within 30 min for CRITICAL)
   - Determine severity
   - Assess affected systems + data
   - Notify security team

3. CONTAIN
   - Rotate compromised credentials
   - Block affected accounts/IPs
   - Service restart if needed

4. REMEDIATE
   - Develop and test fix
   - Deploy via CI/CD pipeline
   - Verify fix in production

5. POST-MORTEM
   - Root cause analysis (within 72 hours)
   - Update security controls to prevent recurrence
   - Document lessons learned
```

### Emergency Contacts

| Role | Contact | Availability |
|------|---------|-------------|
| Security Lead | [email] | 24/7 |
| DevOps Lead | [email] | Business hours |
| Data Protection Officer | [email] | Business hours |

---

## Related Documents

| Document | Location |
|----------|----------|
| Architecture | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| Deployment Guide | [`DEPLOYMENT.md`](./DEPLOYMENT.md) |
| Contributing | [`CONTRIBUTING.md`](./CONTRIBUTING.md) |
