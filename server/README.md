# Lovique Server

Express + TypeScript backend for Lovique. This app handles authentication, session cookies, chat sessions, persistent memory, Gemini chat generation, and protected API routes.

## Stack

- Express 5
- TypeScript
- MongoDB with Mongoose
- Google Gemini API

## API base

Local default:

```text
http://localhost:8002/api/v1
```

Health endpoints:

- `/`
- `/api/health`
- `/api/v1/health`

## Modules

- `auth`
  - register
  - login
  - logout
  - current user
  - forgot password
  - reset password
  - change password
  - update preferences
  - load and clear remembered notes
- `chat`
  - send message
  - list sessions
  - load session history
  - rename session
  - delete session

## Environment variables

Create `server/.env`.

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

Notes:

- `MONGODB_URI` is required.
- `CLIENT_ORIGINS` must include the frontend origin.
- `APP_URL` should point to the frontend app because reset links land on the Next.js auth page.
- `PASSWORD_RESET_EMAIL_SECRET` must match the frontend value exactly.
- If `GEMINI_API_KEY` is missing, auth still works but chat replies will not.

## Scripts

```bash
npm run dev
npm run build
npm run start
```

## Local development

1. Install dependencies:

```bash
npm install
```

2. Add `server/.env`.

3. Start the dev server:

```bash
npm run dev
```

The server starts with `nodemon` + `ts-node` and watches the `src` folder.

## Password reset flow

Lovique uses a split reset flow:

1. The server creates the reset token and stores its hash.
2. The server builds the reset URL pointing to the frontend auth page.
3. In local development, a preview can be returned instead of sending email.
4. In live mode, the server calls the frontend email bridge configured in `PASSWORD_RESET_EMAIL_BRIDGE_URL`.

This keeps the SMTP email sending logic outside the Express deployment when needed.

## Key routes

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

## Useful files

- `src/app.ts` Express app and route mounting
- `src/server.ts` server bootstrap
- `src/modules/auth` auth module
- `src/modules/chat` chat module
- `src/config/env.ts` env parsing
- `src/middleware` auth, not-found, and error middleware

## Build status

The server currently builds successfully with:

```bash
npm run build
```
