# Setup, Deployment, and Operations

## Purpose of this document

This document explains how to run Lovique locally, configure it correctly, deploy it, and verify that a deployment is healthy.

It is intended for:

- developers setting up the project for the first time
- maintainers deploying updates
- teammates debugging environment or infrastructure problems

## 1. Prerequisites

### Required software

| Requirement | Why it is needed |
| --- | --- |
| Node.js | Runs both frontend and backend |
| npm | Installs dependencies and runs scripts |
| MongoDB or MongoDB Atlas | Stores users, sessions, and chat sessions |
| Gemini API key | Powers chat generation |
| SMTP credentials | Sends password reset emails in live mode |

Recommended runtime note:

- the project has been run on modern Node releases, including Node 22 in hosted environments

### Required accounts or services

- MongoDB local instance or MongoDB Atlas cluster
- Google Gemini API access
- an SMTP provider such as Gmail App Password SMTP
- a frontend host for production, typically Vercel
- a backend host for production, typically Render

## 2. Local development setup

### Step 1: install dependencies

From the repo root:

```bash
cd frontend
npm install
cd ../server
npm install
```

### Step 2: configure backend environment

Create `server/.env`.

Recommended local example:

```env
PORT=8002
MONGODB_URI=mongodb://127.0.0.1:27017/lovique
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
CLIENT_ORIGINS=http://localhost:3000
APP_URL=http://localhost:3000
SESSION_TTL_DAYS=7
PASSWORD_RESET_TTL_MINUTES=15
PASSWORD_RESET_EMAIL_BRIDGE_URL=http://localhost:3000/api/email/reset-password
PASSWORD_RESET_EMAIL_SECRET=choose-a-shared-secret
```

### Backend environment variable reference

| Variable | Required | Example | Used by |
| --- | --- | --- | --- |
| `PORT` | No | `8002` | Express server port |
| `MONGODB_URI` | Yes | `mongodb://127.0.0.1:27017/lovique` | MongoDB connection |
| `GEMINI_API_KEY` | Required for chat | `...` | Gemini client |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Chat model selection |
| `CLIENT_ORIGINS` | Yes | `http://localhost:3000` | CORS allowlist |
| `APP_URL` | Yes | `http://localhost:3000` | Reset-link target |
| `SESSION_TTL_DAYS` | No | `7` | Session expiry |
| `PASSWORD_RESET_TTL_MINUTES` | No | `15` | Reset token expiry |
| `PASSWORD_RESET_EMAIL_BRIDGE_URL` | Required for live email | `http://localhost:3000/api/email/reset-password` | Backend-to-frontend reset bridge |
| `PASSWORD_RESET_EMAIL_SECRET` | Required for live email | `choose-a-shared-secret` | Shared secret with frontend email route |

### Step 3: configure frontend environment

Create `frontend/.env.local` or `frontend/.env`.

Recommended local example:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8002/api/v1
API_PROXY_TARGET_URL=http://localhost:8002/api/v1

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_SECURE=true

MAILER_FROM_EMAIL=your@gmail.com
MAILER_FROM_NAME=Lovique
PASSWORD_RESET_EMAIL_SECRET=choose-a-shared-secret
```

### Frontend environment variable reference

| Variable | Required | Example | Used by |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | `http://localhost:8002/api/v1` | Frontend API config fallback |
| `API_PROXY_TARGET_URL` | Strongly recommended | `http://localhost:8002/api/v1` | Same-origin proxy target |
| `SMTP_HOST` | Required for live email | `smtp.gmail.com` | Reset email route |
| `SMTP_PORT` | Required for live email | `465` | Reset email route |
| `SMTP_USER` | Required for live email | `your@gmail.com` | Reset email route |
| `SMTP_PASS` | Required for live email | `gmail-app-password` | Reset email route |
| `SMTP_SECURE` | Optional | `true` | Reset email route |
| `MAILER_FROM_EMAIL` | Recommended | `your@gmail.com` | Reset sender |
| `MAILER_FROM_NAME` | Recommended | `Lovique` | Reset sender |
| `PASSWORD_RESET_EMAIL_SECRET` | Required for live email | `choose-a-shared-secret` | Shared secret with backend |

Important note:

- `SMTP_PASS` for Gmail should be a Gmail App Password, not your main Gmail password

### Step 4: start the backend

```bash
cd server
npm run dev
```

Expected behavior:

- MongoDB connection log
- server listening on `http://localhost:8002`

### Step 5: start the frontend

```bash
cd frontend
npm run dev
```

Expected behavior:

- Next.js starts on `http://localhost:3000`

### Step 6: perform a local smoke test

Checklist:

1. Open `http://localhost:3000`
2. Create an account
3. Confirm you land on `/dashboard`
4. Refresh `/dashboard` and verify the session persists
5. Send a chat message
6. Open Settings and update companion preferences
7. Trigger forgot password and confirm local preview or email behavior

## 3. Build commands

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

### Backend

```bash
cd server
npm run build
```

Important backend build note:

- `server/.npmrc` includes `include=dev` so hosted builds install the TypeScript type packages needed for compilation

## 4. Recommended production topology

Current recommended deployment shape:

- frontend on Vercel
- backend on Render
- database on MongoDB Atlas
- Gemini as external AI provider
- SMTP provider reachable by the frontend email route

Why this topology matches the current implementation:

- Next.js internal API routes are already used for proxying and email
- backend session cookies are designed to work through the frontend proxy
- Render is compatible with the Express server start/build model

## 5. Backend deployment process

### Render setup

Recommended service settings:

- Root directory: `server`
- Build command: `npm install --include=dev && npm run build`
- Start command: `npm run start`

If `npm install --include=dev` is not used explicitly, the committed `.npmrc` helps ensure dev dependencies still get installed.

### Required backend production environment

Example:

```env
NODE_ENV=production
PORT=8002
MONGODB_URI=your-production-mongodb-uri
GEMINI_API_KEY=your-production-gemini-key
GEMINI_MODEL=gemini-2.5-flash
CLIENT_ORIGINS=https://your-frontend-domain.vercel.app,http://localhost:3000
APP_URL=https://your-frontend-domain.vercel.app
SESSION_TTL_DAYS=7
PASSWORD_RESET_TTL_MINUTES=15
PASSWORD_RESET_EMAIL_BRIDGE_URL=https://your-frontend-domain.vercel.app/api/email/reset-password
PASSWORD_RESET_EMAIL_SECRET=shared-secret
```

### Backend deployment verification

After deploy:

1. Open `https://your-backend-domain/api/v1/health`
2. Confirm a healthy JSON response
3. Confirm Render logs show request lines from Morgan

## 6. Frontend deployment process

### Vercel setup

Recommended project settings:

- Root directory: `frontend`
- Framework: Next.js

### Required frontend production environment

Example:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain/api/v1
API_PROXY_TARGET_URL=https://your-backend-domain/api/v1

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_SECURE=true

MAILER_FROM_EMAIL=your@gmail.com
MAILER_FROM_NAME=Lovique
PASSWORD_RESET_EMAIL_SECRET=shared-secret
```

### Important production notes

- `API_PROXY_TARGET_URL` should point to the backend `api/v1` base
- `PASSWORD_RESET_EMAIL_SECRET` must exactly match the backend secret
- the frontend deployment must support Node runtime routes because the reset email route uses `runtime = 'nodejs'`

## 7. Production rollout order

Recommended order:

1. Deploy the backend first
2. Confirm backend health endpoint works
3. Set or update frontend env to point at the backend
4. Deploy the frontend
5. Test the auth flow from the live frontend
6. Test a real chat request
7. Test password reset delivery

Why this order helps:

- the frontend proxy depends on the backend target URL being live
- reset email flow depends on the frontend route and backend bridge being aligned

## 8. Post-deploy verification checklist

### Core app checks

- Landing page loads
- Register works
- Login works
- Refresh after login still keeps the user signed in
- `/dashboard` loads recent sessions
- sending a chat message returns a reply
- settings save companion preferences
- logout clears access to protected routes

### Password reset checks

- forgot-password request returns success
- reset email arrives in inbox or spam
- reset link opens the auth reset flow
- password reset invalidates old sessions
- login with the new password works

### Operational checks

- backend health endpoint responds
- backend Morgan logs show production traffic
- no raw CORS failures in browser console
- no repeated `401` after a successful login

## 9. Observability guidance

### Backend logs

Morgan production logs are intentionally compact.

Example pattern:

```text
POST /api/v1/auth/login 200 42.3 ms origin=https://your-frontend-domain.vercel.app ip=203.0.113.10
```

What to look for:

- correct request path
- expected status code
- request origin
- response time

### Browser tools

When debugging frontend issues, inspect:

- Network tab
- Application/Cookies
- Console tab

Most important requests to verify:

- `/api/proxy/auth/login`
- `/api/proxy/auth/me`
- `/api/proxy/chat/sessions`
- `/api/proxy/chat/messages`

## 10. Operational best practices

- rotate secrets if they are ever exposed
- keep `CLIENT_ORIGINS` limited to real allowed origins
- keep `APP_URL` aligned with the real frontend URL
- use Gmail App Passwords rather than raw account passwords
- test login persistence after any cookie, proxy, or domain change
- test password reset after any env change involving the email bridge
- verify Gemini model availability when changing `GEMINI_MODEL`

## 11. Release checklist

Before a release, verify:

- frontend `npm run lint`
- frontend `npm run build`
- backend `npm run build`
- docs updated for any env or flow changes
- live environment variables are aligned across frontend and backend
- one real end-to-end login and chat flow succeeds

## 12. Where to look next

- For architecture details, read [technical architecture](./technical-architecture.md).
- For request lifecycles, read [workflows and sequence diagrams](./workflows-and-sequences.md).
- For failure recovery, read [troubleshooting and failure modes](./troubleshooting-and-failure-modes.md).
