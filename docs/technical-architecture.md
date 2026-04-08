<!-- File: docs/technical-architecture.md -->
# Technical Architecture

## Purpose of this document

This document explains how Lovique works end to end.

It is written for:

- developers onboarding to the codebase
- reviewers trying to understand system decisions
- technical stakeholders who want to understand the architecture without reading every file first

This is the best place to understand the big picture before going deeper into the [module reference](./module-reference.md) or [workflow diagrams](./workflows-and-sequences.md).

## Executive summary

Lovique is a full-stack AI companion product built as two cooperating applications:

- a Next.js frontend responsible for UI, navigation, local interaction state, a same-origin API proxy, and password reset email delivery
- an Express + MongoDB backend responsible for authentication, session cookies, chat sessions, memory persistence, and Gemini-generated replies

The product is designed around a few important architectural ideas:

1. Browser requests should feel same-origin even when the API is hosted elsewhere.
2. Authentication should use durable HTTP-only sessions instead of storing auth tokens in browser JavaScript.
3. Chat should feel continuous, but token usage should stay controlled.
4. Operational failures should surface as friendly product messages rather than raw infrastructure errors.
5. Backend code should be organized by feature module instead of by technical layer only.

## System context

```mermaid
flowchart LR
  User[User in browser] --> NextUI[Next.js frontend UI]
  NextUI --> Proxy[/Next.js API proxy<br/>/api/proxy/[...path]/]
  Proxy --> ExpressAPI[Express API]
  ExpressAPI --> Mongo[(MongoDB)]
  ExpressAPI --> Gemini[Google Gemini API]
  ExpressAPI --> EmailBridge[/Next.js reset email route<br/>/api/email/reset-password/]
  EmailBridge --> SMTP[SMTP provider]
```

## Runtime topology

| Layer | Technology | Primary responsibility |
| --- | --- | --- |
| Presentation | Next.js 16 + React 19 | Pages, app shell, auth screens, dashboard, settings, public pages |
| Client state | Zustand | Session state, chat state, toast state |
| Browser-to-server integration | Next.js API route proxy | Same-origin request surface for the browser |
| Application API | Express 5 + TypeScript | Auth, chat, memory, validation, session enforcement |
| Persistence | MongoDB + Mongoose | Users, sessions, chat sessions |
| AI provider | Google Gemini API | Reply generation |
| Email delivery | Nodemailer in Next.js route | Password reset email sending |

## High-level repository structure

```text
LoviqueAiBot/
|- docs/
|- frontend/
|  |- app/
|  |- components/
|  |- stores/
|  `- lib/
`- server/
   |- src/config/
   |- src/constants/
   |- src/middleware/
   |- src/modules/auth/
   |- src/modules/chat/
   |- src/types/
   `- src/utils/
```

## Core design decisions

### 1. Same-origin browser API access through Next.js proxy

The browser does not call the Express backend directly. It calls `frontend/app/api/proxy/[...path]/route.ts`, and that route forwards requests to the backend.

Why this was chosen:

- it reduces cross-site cookie problems between frontend and backend hosts
- it lets the browser keep talking to the same origin as the frontend app
- it simplifies deployed auth behavior compared with direct browser-to-Render cookie handling

Tradeoff:

- the proxy becomes part of the request path and must be configured correctly in production
- current implementation is path-based and intentionally simple

### 2. Cookie-based sessions instead of browser-managed bearer tokens

Lovique uses a database-backed session model rather than JWTs stored in local storage.

Why this was chosen:

- HTTP-only cookies reduce accidental exposure to client-side JavaScript
- sessions can be invalidated server-side
- password resets and password changes can revoke sessions cleanly

Tradeoff:

- deployment and proxy configuration need to preserve `Set-Cookie` and credentials correctly

### 3. Feature-module backend structure

The backend is grouped around business domains:

- `auth`
- `chat`

Why this was chosen:

- it keeps related controller, validation, model, and service logic together
- it scales better than a single-file backend
- it makes it easier to reason about end-to-end features

### 4. Lightweight persistent memory instead of full conversation replay

Lovique stores lightweight user memory facts and only sends a trimmed recent conversation plus a compact memory block to Gemini.

Why this was chosen:

- better token efficiency
- lower prompt size
- more predictable AI context

Tradeoff:

- memory is heuristic and intentionally incomplete
- the system will not remember every past detail verbatim forever

### 5. Friendly failure translation

Provider and infrastructure failures are mapped into product-safe language.

Why this was chosen:

- better UX
- less exposure of provider internals
- clearer behavior when the backend is waking from sleep

Tradeoff:

- deep debugging still requires logs and code understanding, not just the UI message

## Frontend architecture

### Route structure

Public routes:

- `/`
- `/auth`
- `/about`
- `/contact`
- `/privacy`
- `/terms`

Protected app routes:

- `/dashboard`
- `/settings`

Internal API routes:

- `/api/proxy/[...path]`
- `/api/email/reset-password`

### Layout and shell strategy

The root layout is in `frontend/app/layout.tsx`.

Important responsibilities:

- global fonts
- theme initialization script
- metadata and app icons
- wrapping the app in `RouteShell`

`RouteShell` decides whether the current route should live inside the persistent authenticated shell.

Current behavior:

- `/dashboard` and `/settings` render inside `AppShell`
- other pages render directly with a page animation wrapper
- `ToastViewport` is mounted globally

Why this matters:

- protected routes keep their shared shell mounted
- moving between dashboard and settings feels closer to an SPA
- top-level layout flicker is reduced

### App shell

`frontend/components/app-shell.tsx` is the main authenticated application frame.

It is responsible for:

- initial session boot
- protected route gating
- service wake-up UX
- mobile sidebar and desktop sidebar
- recent conversation list
- rename/delete interaction state
- top-level logout handling
- persistent footer and theme toggle

This component is effectively the frontend control center for the private area of the app.

### State management

The frontend uses Zustand stores instead of scattering API calls inside each component.

#### `auth-store`

Responsibilities:

- current user
- session booting state
- register/login/logout
- forgot/reset password
- password change
- preference updates
- local reset preview state

#### `chat-store`

Responsibilities:

- active session ID
- chat messages
- remembered notes
- recent session list
- optimistic chat sending
- rename/delete session actions
- memory clearing
- fresh chat reset

#### `toast-store`

Responsibilities:

- add transient success/info/error notifications
- deduplicate repeated toasts
- auto-dismiss after timeout

### Client API wrapper

`frontend/lib/api.ts` is the browser-facing transport layer.

Important behaviors:

- all requests go to `/api/proxy`
- credentials are included on every request
- requests use a timeout
- a wake-up probe can hit `/health`
- selected errors are retried once after wake-up
- generic server errors are translated into friendlier messages

This file is the main frontend boundary between UI/state code and backend integration.

### Internal frontend API routes

#### Proxy route

`frontend/app/api/proxy/[...path]/route.ts`

Responsibilities:

- build the target backend URL from env
- forward method, headers, body, and cookie
- forward `Set-Cookie` back to the browser

Notable constraints:

- it currently supports `GET`, `POST`, `PATCH`, and `DELETE`
- it is built around path forwarding
- the implementation is intentionally minimal

#### Reset email route

`frontend/app/api/email/reset-password/route.ts`

Responsibilities:

- verify a shared secret from the backend
- validate SMTP configuration
- send password reset email via Nodemailer
- return safe JSON responses

Why this route exists:

- SMTP credentials live on the frontend deployment
- the Express backend only needs to create tokens and ask for email delivery

## Backend architecture

### Application bootstrap

`server/src/server.ts` is the entry point.

Key behavior:

- reads the app from `app.ts`
- connects to MongoDB before listening
- sets a Google DNS server override in development mode
- exits the process if startup fails

`server/src/app.ts` creates the Express app and wires middleware and routes.

Pipeline order:

1. CORS
2. Morgan request logging
3. JSON parsing
4. URL-encoded parsing
5. health endpoints
6. auth routes
7. chat routes
8. not-found middleware
9. error middleware

### Configuration layer

`server/src/config/env.ts` parses and normalizes environment variables.

Important behavior:

- trims empty strings to fall back to defaults
- parses numbers safely
- parses comma-separated client origins
- exports `isProduction` for cookie behavior and other environment-sensitive logic

`server/src/config/database.ts` is intentionally small:

- validate `MONGODB_URI`
- connect with Mongoose
- log the connected host

### Auth module

Location: `server/src/modules/auth`

Responsibilities:

- registration
- login
- logout
- current user lookup
- forgot password
- reset password
- change password
- update preferences
- load and clear remembered notes
- create and validate session context

The auth module is split into:

- `auth.routes.ts`
- `auth.controller.ts`
- `auth.service.ts`
- `auth.validation.ts`
- `auth.types.ts`
- `user.model.ts`
- `session.model.ts`
- `profile.constants.ts`
- `user.memory.ts`

#### Auth controller/service split

Controllers are intentionally thin:

- validate request payloads
- pull auth context from `req.auth`
- call service methods
- shape HTTP responses
- manage cookie set/clear

Services contain the real logic:

- password hashing and verification
- session creation
- session lookup from cookie token
- reset token generation and verification
- profile normalization
- memory serialization

#### Session model

Sessions are stored in MongoDB rather than memory.

Important details:

- raw session tokens are never stored
- only a SHA-256 hash is stored
- expiry is enforced both in queries and with a TTL index
- `userAgent` and `ipAddress` are recorded for context

#### Password reset design

Important details:

- raw reset token is generated once
- only its hash is stored
- reset token has an expiry timestamp
- reset URL points back to the frontend auth page
- local preview is allowed only in local development conditions
- live email sending happens through the frontend bridge

### Chat module

Location: `server/src/modules/chat`

Responsibilities:

- send user message to Gemini
- persist chat history
- list sessions
- load session history
- rename session
- delete session

The chat module is split into:

- `chat.routes.ts`
- `chat.controller.ts`
- `chat.service.ts`
- `chat.validation.ts`
- `chat.types.ts`
- `chat.model.ts`

#### Prompt-building strategy

The chat service does not send all past messages to Gemini.

It builds the prompt from:

- trimmed recent chat history
- compact conversation memory summary
- compact long-term memory block
- user profile preferences
- personality baseline

This keeps prompts shorter while preserving recent context and key remembered facts.

#### AI failure mapping

The chat service detects several provider failure modes:

- auth or key problems
- model not found
- rate limits
- provider/network unavailability

Those are translated into `ApiError` responses with safer messages and meaningful status codes.

### Middleware layer

#### `requireAuth`

Responsibilities:

- read session cookie from the request
- load session context from the backend session store
- clear the cookie if the session is invalid or expired
- attach `req.auth`

#### `errorHandler`

Responsibilities:

- serialize `ApiError` cleanly
- fall back to a safe friendly 500 response for unknown errors

#### `notFoundHandler`

Responsibilities:

- return a JSON 404 response for unknown routes

### Utilities layer

Important shared utilities:

- `apiError.ts` for explicit typed operational errors
- `asyncHandler.ts` for async Express route safety
- `cookies.ts` for reading and writing the session cookie
- `crypto.ts` for secure token generation and password hashing
- `validate.ts` for string, enum, email, and password validation
- `types/express.d.ts` for `req.auth` augmentation

## Data model

### User

Stored in `user.model.ts`.

Key fields:

- `name`
- `email`
- `companionGender`
- `companionPersonality`
- `memoryFacts`
- `passwordHash`
- `passwordSalt`
- `passwordResetTokenHash`
- `passwordResetExpiresAt`
- `lastLoginAt`
- `createdAt`
- `updatedAt`

Notes:

- `gender` still exists as an optional legacy field for compatibility logic
- `memoryFacts` is an embedded array of normalized memory items

### Session

Stored in `session.model.ts`.

Key fields:

- `userId`
- `tokenHash`
- `expiresAt`
- `userAgent`
- `ipAddress`
- timestamps

Notes:

- `expiresAt` has a TTL index
- `tokenHash` is unique

### ChatSession

Stored in `chat.model.ts`.

Key fields:

- `userId`
- `sessionId`
- `title`
- `history`
- timestamps

Notes:

- `(userId, sessionId)` is unique
- `history` stores both user and model messages

## Security model

### Authentication

- HTTP-only session cookie named `lovique_session`
- cookie settings vary by production/development
- production uses `SameSite=None` and `Secure`
- session store is server-side and revocable

### Password handling

- passwords are hashed with `scrypt`
- password comparisons use `timingSafeEqual`
- reset tokens are hashed before storage

### Request protection

- protected routes use `requireAuth`
- allowed browser origins are enforced with CORS on the backend
- frontend proxy reduces cross-site browser auth complexity

### Operational secrets

Important secrets include:

- `GEMINI_API_KEY`
- `PASSWORD_RESET_EMAIL_SECRET`
- `SMTP_PASS`
- database credentials inside `MONGODB_URI`

## Performance and token-usage controls

The chat service uses explicit limits to keep requests bounded.

Important limits in current code:

- max stored messages per session: `20`
- max prompt messages sent to Gemini: `8`
- max prompt chars: `3600`
- max chars per history message in prompt: `420`
- max memory entries sampled for older context: `6`
- max memory chars in prompt block: `900`
- max output tokens: `420`

Why this matters:

- lower AI cost
- faster responses
- smaller risk of oversized prompts
- more predictable behavior across long chats

## Observability and operations

### Logging

Morgan is enabled in both development and production.

Production logs include:

- HTTP method
- URL
- status
- response time
- `origin` header
- remote address

Health endpoints are skipped from request logging so the logs stay focused on real user traffic.

### Health endpoints

Available endpoints:

- `GET /`
- `GET /api/health`
- `GET /api/v1/health`

Purpose:

- platform wake-up probes
- uptime checks
- frontend retry/wake flow

### Environment-sensitive behavior

Some behavior changes depending on environment:

- session cookie `SameSite` and `Secure`
- local password reset preview
- local development DNS override in `server.ts`
- deployed origins accepted by CORS

## Implementation notes that are easy to miss

- `server/tsconfig.json` uses `ts-node.files=true` so the Express request augmentation loads correctly in development
- `server/.npmrc` includes `include=dev` so TypeScript builds on platforms like Render do not miss dev type packages
- `frontend/app/layout.tsx` uses an inline theme script plus hydration suppression to reduce theme mismatch issues
- `frontend/app/auth/page.tsx` wraps `AuthShell` in `Suspense` because auth mode comes from search params
- `frontend/components/dashboard-shell.tsx` uses `useDeferredValue` to keep chat rendering smoother

## Known limitations and tradeoffs

- memory extraction is regex-based, not semantic retrieval
- the chat model is coupled to Gemini availability and quota
- the proxy is intentionally simple and only implements the methods currently needed
- password reset email delivery depends on the frontend runtime and SMTP config being healthy
- there is no background job queue for email or cleanup work
- the frontend proxy is path-oriented and should be treated carefully if the API grows more query-heavy
- there is no dedicated CSRF token layer today; if the product grows beyond the current same-origin proxy pattern, this should be revisited

## Where to go next

- For file-by-file responsibility and exported functions, read the [module reference](./module-reference.md).
- For request-by-request behavior, read [workflows and sequence diagrams](./workflows-and-sequences.md).
- For deployment and troubleshooting, read [setup, deployment, and operations](./setup-deployment-operations.md) and [troubleshooting and failure modes](./troubleshooting-and-failure-modes.md).
