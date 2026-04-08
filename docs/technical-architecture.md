<!-- File: docs/technical-architecture.md -->
# Technical Architecture

## System overview

Lovique is a full-stack web product with a Next.js frontend and an Express + MongoDB backend.

At a high level:

```text
Browser
  -> Next.js frontend (UI, routing, proxy, reset email route)
  -> Express API (auth, chat, sessions, memory)
  -> MongoDB (users, sessions, chat sessions)
  -> Gemini API (chat generation)
```

## Main applications

### Frontend

Location: [frontend](../frontend)

Primary responsibilities:

- landing page and public pages
- auth screens
- dashboard and settings UI
- theme switching
- Zustand state management
- same-origin API proxy for backend requests
- reset email API route using SMTP
- toast notifications and friendly request states

Important frontend pieces:

- `frontend/app` route structure
- `frontend/components` UI shell and page components
- `frontend/stores/auth-store.ts` auth state and actions
- `frontend/stores/chat-store.ts` chat state and actions
- `frontend/lib/api.ts` client API wrapper
- `frontend/app/api/proxy/[...path]/route.ts` backend proxy
- `frontend/app/api/email/reset-password/route.ts` reset email sender

### Backend

Location: [server](../server)

Primary responsibilities:

- user registration and login
- cookie-based session management
- password reset token generation
- chat session storage
- persistent memory storage
- Gemini prompt construction and reply generation
- request validation and protected routes

Important backend pieces:

- `server/src/app.ts` app bootstrap and route mounting
- `server/src/modules/auth` auth module
- `server/src/modules/chat` chat module
- `server/src/config/env.ts` environment parsing
- `server/src/middleware` auth, error, and not-found handling

## Architectural approach

The codebase uses a modular backend and a route-based frontend.

Key design choices:

- backend business logic is grouped by feature module instead of one large file
- frontend uses a shared app shell for navigation and protected-area UX
- browser requests go through a Next.js same-origin proxy to reduce cross-site cookie issues
- the backend stores durable state in MongoDB
- Gemini receives only trimmed recent context plus compact memory, not the full history

## Frontend route map

Public routes:

- `/`
- `/auth`
- `/about`
- `/contact`
- `/privacy`
- `/terms`

Protected product routes:

- `/dashboard`
- `/settings`

Internal routes:

- `/api/proxy/[...path]`
- `/api/email/reset-password`

## Backend route map

Base API:

- `/api/v1`

Health:

- `GET /`
- `GET /api/health`
- `GET /api/v1/health`

Auth:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/change-password`
- `PATCH /api/v1/auth/preferences`
- `GET /api/v1/auth/memories`
- `DELETE /api/v1/auth/memories`

Chat:

- `POST /api/v1/chat/messages`
- `GET /api/v1/chat/sessions`
- `GET /api/v1/chat/sessions/:sessionId`
- `PATCH /api/v1/chat/sessions/:sessionId`
- `DELETE /api/v1/chat/sessions/:sessionId`

## Core flows

### 1. Authentication and session flow

1. The user logs in or registers from the frontend.
2. The browser sends the request to the Next.js proxy.
3. The proxy forwards it to the Express backend.
4. The backend validates input, creates or verifies the user, and creates a session record in MongoDB.
5. The backend sets the `lovique_session` HTTP-only cookie.
6. The proxy forwards the `Set-Cookie` header back to the browser.
7. Future protected requests reuse that cookie through the same-origin frontend route.

Why this matters:

- it avoids many third-party cookie problems between Vercel and Render
- it keeps the browser talking to the frontend origin
- it allows the backend to stay session-cookie based

### 2. Password reset flow

1. The user submits an email address on the forgot-password screen.
2. The backend generates a reset token, stores only its hash, and builds a reset URL pointing back to the frontend auth page.
3. In local development, the backend may expose a preview instead of sending email.
4. In live mode, the backend calls the Next.js reset email route.
5. The Next.js route sends the email using SMTP through Nodemailer.
6. The user opens the reset link and submits a new password.
7. The backend verifies the token hash and expiry, updates the password, and invalidates existing sessions.

Why this split exists:

- it keeps SMTP credentials out of the Express deployment
- it works around hosting constraints where frontend env handling is easier than backend email setup

### 3. Chat session flow

1. The user opens an existing session or starts a new one.
2. The frontend sends the user message and session ID to the backend.
3. The backend loads the chat session and recent history from MongoDB.
4. The backend builds a trimmed prompt history and memory block.
5. Gemini generates the reply.
6. The backend stores both the user message and model reply back into the chat session.
7. The frontend updates the visible conversation and recent-session list.

Notes:

- only a limited recent slice of messages is sent to Gemini
- the stored conversation history is also capped
- session titles are auto-generated from the first user message when needed

### 4. Persistent memory flow

Persistent memory is intentionally lightweight.

1. The backend checks each user message for memory-like patterns.
2. Facts such as favorites, names, preferences, location, work, study, or explicit "remember" notes are normalized.
3. The best recent memory items are stored on the user document.
4. A compact memory block is inserted into the Gemini system instruction when relevant.
5. The frontend can display or clear remembered notes from settings.

This design trades completeness for lower token usage and predictable behavior.

## Data model summary

### User

Stores:

- name
- email
- password hash and salt
- companion gender
- companion personality
- password reset token hash and expiry
- remembered memory facts
- timestamps

### Session

Stores:

- user ID
- hashed session token
- expiry time
- user agent
- IP address

### ChatSession

Stores:

- user ID
- session ID
- optional title
- history of user/model messages
- timestamps

## State management on the frontend

The frontend uses Zustand rather than scattering request logic in components.

Main stores:

- `auth-store`
  session user, auth actions, preferences, password actions
- `chat-store`
  session list, active chat, history, remembered notes, send-message flow
- `toast-store`
  transient success and error notifications

Benefits:

- simpler component tree
- fewer duplicated loading/error states
- easier protected-route UX

## Request handling strategy

The frontend API client has a few important behaviors:

- all browser calls go to `/api/proxy`
- requests include credentials
- requests use a timeout
- wake-up retries happen for sleepy infrastructure statuses
- raw technical errors are translated into friendlier product language

This is especially useful on hosts where the backend may sleep between requests.

## Error handling strategy

The backend does not pass provider-specific Gemini errors straight through to the UI.

Instead it maps them into product-safe categories such as:

- model unavailable
- auth/configuration unavailable
- rate limited
- temporarily unavailable

The frontend then shows:

- inline errors
- loading or wake-up states
- toast notifications

The goal is to keep failures understandable without leaking implementation details.

## Security and privacy notes

Current protections include:

- HTTP-only session cookie
- password hashing with salt
- reset token hashing instead of storing raw tokens
- server-side auth checks for protected routes
- CORS allowlist on the backend
- same-origin frontend proxy for credentialed browser requests

Important product reality:

- chats and remembered notes are stored
- user content is sent to Gemini for reply generation
- this behavior needs to stay aligned with the privacy documentation

## Deployment model

Current deployment assumptions:

- frontend on Vercel
- backend on Render or a similar Node host
- MongoDB Atlas for database
- Gemini API for model inference

Important environment relationships:

- frontend needs the backend API base or proxy target
- backend needs the frontend app URL for reset links
- backend and frontend share the password-reset bridge secret
- allowed client origins must include the deployed frontend origin

## Observability and operations

The backend includes:

- health endpoints
- request logging with Morgan
- quieter health logging to reduce noise

In production, request logs include:

- method
- path
- status
- response time
- request origin
- remote address

## Known limitations and tradeoffs

- memory extraction is heuristic and regex-driven, not semantic retrieval
- there is no dedicated background job system
- password reset email currently depends on the frontend runtime being available
- session auth still depends on correct cookie forwarding through the proxy
- chat behavior depends on Gemini model availability and quota

## Change-sensitive areas

These are the parts most likely to cause regressions:

- cookie/session behavior between frontend proxy and backend
- CORS and environment configuration
- auth route payload validation
- Gemini model configuration
- memory extraction and memory prompt limits
- password reset bridge secret and URL alignment

When changing any of those, the docs and deployment env notes should be reviewed as part of the same work.
