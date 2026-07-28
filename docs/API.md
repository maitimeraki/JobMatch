# API Reference

> **Document purpose:** Complete reference for every REST endpoint in the JobMatch API. Covers request/response shapes, auth requirements, error codes, and examples.
>
> **Base URL:** `https://jobmatch-api.vercel.app/api/v1` (production) / `http://localhost:3001/api/v1` (development)
>
> **Last updated:** 2026-07-27

---

## Table of Contents

1. [Standard Response Format](#standard-response-format)
2. [Authentication](#authentication)
3. [Posts](#posts)
4. [Jobs](#jobs)
5. [Applications](#applications)
6. [Users & Profiles](#users--profiles)
7. [Notifications](#notifications)
8. [Dashboard & Analytics](#dashboard--analytics)
9. [Endorsements & Referrals](#endorsements--referrals)
10. [Recruiter Tools](#recruiter-tools)
11. [Admin](#admin)
12. [Subscription & Billing](#subscription--billing)
13. [Error Codes](#error-codes)

---

## Standard Response Format

### Success
```json
{
  "success": true,
  "data": { ... }
}
```

### Success (paginated)
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 42,
    "page": 1,
    "limit": 20
  }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

### Authentication Header
```
Authorization: Bearer <access_token>
```

---

## Authentication

### `POST /auth/register`
Create a new user account. Public endpoint.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "role": "SEEKER"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "SEEKER"
    },
    "accessToken": "jwt...",
    "refreshToken": "jwt..."
  }
}
```

**Errors:** `VALIDATION_ERROR` (invalid email), `CONFLICT` (email taken)

---

### `POST /auth/login`
Authenticate with email and password. Public endpoint.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):** Same as register — user + tokens

**Errors:** `UNAUTHORIZED` (bad credentials)

---

### `POST /auth/refresh`
Exchange a refresh token for a new access token. Public endpoint.

**Request:**
```json
{
  "refreshToken": "jwt..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "new-jwt...",
    "refreshToken": "new-refresh-jwt..."
  }
}
```

---

### `POST /auth/logout`
Invalidate current session. Bearer token required.

**Response (200):**
```json
{ "success": true, "data": { "message": "Logged out" } }
```

---

### `GET /auth/me`
Get currently authenticated user with profile. Bearer token required.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "SEEKER",
    "avatar": "https://...",
    "profile": { "headline": "...", "skills": ["React", "Node.js"], ... }
  }
}
```

---

## Posts

### `GET /posts`
Get feed posts (cursor-based pagination). Bearer token required.

**Query params:** `?cursor=<id>&limit=20&category=PROJECT_SHOWCASE`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "content": "Post text...",
      "category": "DISCUSSION",
      "mediaUrl": "https://...",
      "mediaType": "IMAGE",
      "author": { "id": "uuid", "name": "...", "avatar": "..." },
      "likesCount": 5,
      "commentsCount": 2,
      "hasLiked": true,
      "createdAt": "2026-07-27T12:00:00.000Z"
    }
  ],
  "nextCursor": "uuid-or-null"
}
```

### `POST /posts`
Create a new post. Bearer token required.

**Request:**
```json
{
  "content": "My new post",
  "category": "DISCUSSION",
  "mediaUrl": "https://...",
  "mediaType": "IMAGE"
}
```

**Response (201):** Created post object

### `GET /posts/:id`
Get single post with full details. Bearer token required.

### `DELETE /posts/:id`
Delete own post. Bearer token required.

### `POST /posts/:id/like`
Toggle like on a post. Bearer token required. Idempotent (liked → unlike, unliked → like).

**Response:**
```json
{ "success": true, "data": { "liked": true, "likesCount": 6 } }
```

### `POST /posts/:id/comment`
Add a comment. Bearer token required.

**Request:**
```json
{ "content": "Great post!" }
```

**Response (201):** Created comment object

---

## Jobs

### `GET /jobs`
Search job listings. Public endpoint.

**Query params:** `?search=react&location=remote&type=FULL_TIME&level=SENIOR&page=1&limit=20`

**Response (paginated):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Senior React Developer",
        "company": { "name": "Acme Corp", "logo": "..." },
        "location": "Remote",
        "type": "FULL_TIME",
        "level": "SENIOR",
        "salaryMin": 100000,
        "salaryMax": 150000,
        "salaryCurrency": "USD",
        "skills": ["React", "TypeScript", "Node.js"],
        "createdAt": "2026-07-27T12:00:00.000Z"
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 20
  }
}
```

### `POST /jobs`
Create a job listing. RECRUITER role required.

**Request:**
```json
{
  "title": "Senior React Developer",
  "description": "We're looking for...",
  "location": "Remote",
  "type": "FULL_TIME",
  "level": "SENIOR",
  "salaryMin": 100000,
  "salaryMax": 150000,
  "salaryCurrency": "USD",
  "skills": ["React", "TypeScript", "Node.js"]
}
```

**Plan check:** Free tier limited to 1 active job.

### `GET /jobs/:id`
Get single job with recruiter/company info. Public.

### `PATCH /jobs/:id`
Update job listing. RECRUITER owner only.

### `DELETE /jobs/:id`
Delete job listing. RECRUITER owner only.

### `GET /jobs/:id/applications`
List applicants for a job. RECRUITER owner only.

**Query params:** `?status=PENDING&level=SENIOR&sortBy=newest&page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "app-uuid",
        "applicant": { "id": "uuid", "name": "...", "avatar": "..." },
        "status": "PENDING",
        "estimatedLevel": "SENIOR",
        "totalYearsExp": 7,
        "appliedDate": "2026-07-27T12:00:00.000Z",
        "resumeUrl": "https://..."
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 20
  }
}
```

### `POST /jobs/:id/apply`
Apply to a job. SEEKER role required.

**Request (multipart/form-data):**
```
resume: <file>
coverLetter: "Optional cover letter text"
```

### `POST /jobs/:id/bookmark`
Toggle bookmark. SEEKER role required.

---

## Applications

### `GET /applications`
Get current user's applications. SEEKER role required.

**Query params:** `?page=1&limit=20`

### `PATCH /applications/:id/status`
Update application status (move through pipeline). RECRUITER role required.

**Request:**
```json
{ "status": "REVIEWING", "note": "Phone screen scheduled" }
```

**Valid transitions:** PENDING → REVIEWING → SHORTLISTED → HIRED | REJECTED

---

## Users & Profiles

### `GET /users/search`
Search users. Bearer token required.

**Query params:** `?q=john&role=SEEKER&skill=React&page=1&limit=20`

### `GET /users/:id/profile`
Get user's public profile. Bearer token required.

### `PATCH /users/profile`
Update own profile. Bearer token required.

**Request:**
```json
{
  "name": "John Updated",
  "avatar": "https://...",
  "bio": "Full-stack developer",
  "headline": "Senior Engineer at Acme",
  "location": "San Francisco",
  "skills": ["React", "Node.js", "PostgreSQL"],
  "experience": [
    { "title": "Senior Engineer", "company": "Acme Corp", "startDate": "2020-01-01", "endDate": null, "description": "..." }
  ],
  "education": [
    { "degree": "B.S. Computer Science", "school": "MIT", "startYear": 2014, "endYear": 2018 }
  ]
}
```

**Note:** Updates trigger `matchAlertService.checkNewMatches()` to notify recruiters with matching jobs.

### `POST /users/:id/follow`
Toggle follow. Bearer token required.

### `GET /users/:id/followers`
List followers. Bearer token required.

### `GET /users/:id/following`
List following. Bearer token required.

---

## Notifications

### `GET /notifications`
List notifications. Bearer token required.

**Query params:** `?unreadOnly=true&page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "type": "NEW_APPLICANT",
        "title": "New Application",
        "message": "John applied for Senior React Developer",
        "read": false,
        "link": "/jobs/uuid",
        "createdAt": "2026-07-27T12:00:00.000Z"
      }
    ],
    "unreadCount": 3,
    "total": 10,
    "page": 1,
    "limit": 20
  }
}
```

**Notification types:** `FOLLOW`, `LIKE`, `COMMENT`, `POST_ENDORSED`, `REFERRAL_REQUEST`, `REFERRAL_ACCEPTED`, `APPLICATION_UPDATE`, `NEW_APPLICANT`, `JOB_RECOMMENDATION`, `PROFILE_VIEWED`, `JOB_BOOSTED`, `PREMIUM_EXPIRING`, `PAYOUT_RECEIVED`

### `PATCH /notifications/:id/read`
Mark one notification as read.

### `PATCH /notifications/read-all`
Mark all notifications as read.

---

## Dashboard & Analytics

### `GET /dashboard/stats`
Recruiter dashboard statistics. RECRUITER role required.

**Response:**
```json
{
  "success": true,
  "data": {
    "activeJobs": 3,
    "totalApplications": 45,
    "avgTimeToHire": 12,
    "referralHires": 2,
    "applicationsOverTime": [
      { "date": "2026-07-01", "count": 5 }
    ],
    "sourceBreakdown": [
      { "source": "DIRECT", "count": 35 },
      { "source": "REFERRAL", "count": 10 }
    ],
    "hiringFunnel": [
      { "status": "PENDING", "count": 20 },
      { "status": "REVIEWING", "count": 10 },
      { "status": "SHORTLISTED", "count": 5 },
      { "status": "HIRED", "count": 8 },
      { "status": "REJECTED", "count": 2 }
    ]
  }
}
```

### `GET /dashboard/pipeline`
Kanban pipeline of all applications. RECRUITER role required.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "status": "PENDING",
      "applications": [
        {
          "id": "uuid",
          "applicant": { "id": "uuid", "name": "John", "avatar": "..." },
          "headline": "Senior Engineer",
          "skills": ["React", "TypeScript"],
          "jobTitle": "Senior React Developer",
          "appliedDate": "2026-07-27T12:00:00.000Z",
          "estimatedLevel": "SENIOR",
          "totalYearsExp": 7
        }
      ]
    }
  ]
}
```

### `GET /dashboard/talent-pool`
Top matching candidates across all jobs. RECRUITER role required.

**Query params:** `?jobId=<optional-specific-job>`

### `GET /dashboard/most-engaged`
Top engaged seekers. Public.

### `GET /jobs/:id/talent-pool`
Description-based talent matching for a specific job. RECRUITER owner.

**Response:**
```json
{
  "success": true,
  "data": {
    "candidates": [
      {
        "id": "uuid",
        "name": "Jane Doe",
        "avatar": "...",
        "headline": "Full-Stack Developer",
        "skills": ["React", "Node.js"],
        "matchScore": 82,
        "estimatedLevel": "SENIOR",
        "totalYearsExp": 6,
        "scoreBreakdown": {
          "skillMatch": 32,
          "descriptionMatch": 28,
          "experienceLevelMatch": 15,
          "educationMatch": 7
        }
      }
    ],
    "totalCandidates": 25
  }
}
```

### `GET /jobs/:id/analytics`
Per-job application analytics. RECRUITER owner.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalApplicants": 30,
    "experienceDistribution": [
      { "level": "JUNIOR", "count": 12, "percentage": 40 },
      { "level": "MID", "count": 10, "percentage": 33 },
      { "level": "SENIOR", "count": 6, "percentage": 20 },
      { "level": "LEAD", "count": 2, "percentage": 7 }
    ],
    "skillsCoverage": [
      { "skill": "React", "matchCount": 28, "total": 30, "percentage": 93 }
    ],
    "applicantFlow": [
      { "date": "2026-07-01", "count": 3 }
    ],
    "avgSkillMatch": 68
  }
}
```

---

## Endorsements & Referrals

### `POST /endorsements`
Endorse a user's skill. RECRUITER role required.

**Request:**
```json
{ "userId": "uuid", "skillId": "uuid", "postId": "optional-post-uuid" }
```

### `GET /endorsements/user/:userId`
Get endorsements for a user.

### `POST /referrals`
Create a referral request. RECRUITER role required.

**Request:**
```json
{ "userId": "seeker-uuid", "jobId": "job-uuid", "message": "Referral message" }
```

---

## Recruiter Tools

### `POST /shortlist/toggle`
Save or remove a candidate from shortlist. RECRUITER role required.

**Request:**
```json
{ "candidateId": "uuid", "jobId": "optional-job-uuid" }
```

**Response:**
```json
{ "success": true, "data": { "saved": true } }
```

**Plan check:** Free tier max 10 saves.

### `GET /shortlist`
Get saved candidates. RECRUITER role required.

**Query params:** `?jobId=<optional>&page=1&limit=20`

### `PATCH /shortlist/:candidateId/note`
Add/update private note on a saved candidate. RECRUITER + PRO required.

**Request:**
```json
{ "note": "Strong candidate for the senior role next quarter" }
```

### `GET /shortlist/export`
Export shortlisted candidates as CSV. RECRUITER + PRO required.

**Response:** `Content-Type: text/csv` — file download

### `GET /company/:recruiterId`
Public company profile page.

### `POST /company`
Create company profile. RECRUITER + PRO required.

**Request:**
```json
{
  "companyName": "Acme Corp",
  "logo": "https://...",
  "description": "We're a...",
  "size": "51-200",
  "industry": "Technology",
  "location": "San Francisco"
}
```

### `PUT /company`
Update company profile. RECRUITER + PRO required.

---

## Admin

### `GET /admin/users`
List all users with moderation status. ADMIN role required.

### `PATCH /admin/users/:id/ban`
Ban/unban a user. ADMIN role required.

### `GET /admin/analytics`
Platform-wide analytics. ADMIN role required.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1500,
    "totalJobs": 300,
    "totalApplications": 2000,
    "monthlyActiveUsers": 800,
    "revenue": { "subscriptions": 4500, "boosts": 1200, "fees": 350 }
  }
}
```

---

## Subscription & Billing

> **Note:** Payment processing and media storage (Stripe / Cloudinary) are **future integrations** planned for production release. The subscription and billing endpoints below are defined for forward compatibility. Currently, plan limits are enforced via database flags and manual tier assignment. Job boosts and featured listings are placeholder flows ready for payment gateway integration.

### `GET /subscription/plan`
Get current recruiter plan details. RECRUITER role required.

### `POST /subscription/upgrade`
Upgrade to Pro tier. RECRUITER role required.

### `POST /subscription/cancel`
Cancel Pro subscription. RECRUITER role required.

### `GET /insights/revenue`
Revenue analytics (admin/recruiter).

### `POST /boosts`
Purchase a job boost. RECRUITER role required.

**Request:**
```json
{ "jobId": "uuid", "type": "urgent", "amount": 1900 }
```

---

## Error Codes

| HTTP Status | Code | Meaning |
|-------------|------|---------|
| 400 | `VALIDATION_ERROR` | Invalid request body/params |
| 401 | `UNAUTHORIZED` | Missing/invalid token |
| 403 | `FORBIDDEN` | Insufficient role/ownership |
| 403 | `PLAN_LIMIT_REACHED` | Free tier limit exceeded |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Duplicate resource |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```
