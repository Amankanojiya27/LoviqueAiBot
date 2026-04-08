# Troubleshooting and Failure Modes

## Purpose of this document

This document explains:

- common failure scenarios
- how to diagnose them
- what current limitations exist
- what best practices reduce operational mistakes

Use this when something "works locally but not in deployment," when a flow suddenly starts returning `401`, or when the UI shows a friendly message but you need the technical cause.

## Recommended debugging order

When a problem appears, check in this order:

1. Browser Network tab
2. Browser Console tab
3. Frontend env values
4. Backend env values
5. Vercel logs
6. Render logs
7. MongoDB connectivity
8. Gemini or SMTP configuration

Why this order works:

- most production issues in this stack are request-path, cookie, proxy, or env mismatches

## Issue matrix

### 1. Login succeeds, but `/auth/me` or `/chat/*` immediately returns `401`

#### Symptoms

- login request is `200`
- follow-up protected requests return `401`
- UI falls back to "Sign in to continue"

#### Likely causes

- session cookie was not stored
- proxy target is wrong
- frontend and backend secrets/env are mismatched
- deployed frontend is bypassing the proxy
- old backend deployment does not include the expected cookie settings

#### What to check

- Network tab on the login response
- whether `Set-Cookie` is present
- whether subsequent requests go to `/api/proxy/...`
- whether `API_PROXY_TARGET_URL` points at the live backend
- backend log lines for `/auth/me`

#### Fix

- ensure the frontend uses the proxy, not direct browser calls to the backend
- ensure `API_PROXY_TARGET_URL` points to `https://your-backend-domain/api/v1`
- ensure backend production cookie settings are deployed
- ensure the browser actually receives and stores the cookie

### 2. CORS errors mentioning `Access-Control-Allow-Origin`

#### Symptoms

- browser console shows CORS errors
- direct calls to backend are blocked

#### Likely causes

- frontend is calling the backend directly instead of the proxy
- backend `CLIENT_ORIGINS` does not include the deployed frontend origin

#### What to check

- request URL in the browser Network tab
- backend `CLIENT_ORIGINS`
- frontend `API_PROXY_TARGET_URL`

#### Fix

- use the same-origin Next.js proxy from the browser
- add the deployed frontend URL to `CLIENT_ORIGINS`

### 3. Frontend shows "Lovique is waking up right now"

#### Symptoms

- request times out or shows a friendly wake-up message
- first request after idle is slow

#### Likely causes

- backend host is sleeping after inactivity
- temporary network or cold-start delay

#### What to check

- backend health endpoint
- Render logs
- whether the retry succeeds on the second attempt

#### Fix

- wait for wake-up and retry
- verify the health endpoint is reachable
- consider host or plan changes if cold starts become too disruptive

### 4. Gemini returns model-not-found or auth-related errors

#### Symptoms

- chat requests fail
- backend logs show Gemini fetch/auth/model errors

#### Likely causes

- invalid or expired `GEMINI_API_KEY`
- unsupported `GEMINI_MODEL`
- provider-side issue or quota limit

#### What to check

- backend logs
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

#### Fix

- update the API key
- switch to a model that is actually available for your key/project
- redeploy after env updates

### 5. Reset password says the service is unavailable

#### Symptoms

- forgot-password returns `503`
- message indicates reset recovery is temporarily unavailable

#### Likely causes

- backend email bridge URL or secret missing
- frontend email route SMTP config missing
- local preview disabled and live email config incomplete

#### What to check

- backend `PASSWORD_RESET_EMAIL_BRIDGE_URL`
- backend `PASSWORD_RESET_EMAIL_SECRET`
- frontend `PASSWORD_RESET_EMAIL_SECRET`
- frontend SMTP env values

#### Fix

- align the shared secret
- configure the frontend email route completely
- ensure backend points at the live frontend email route

### 6. Reset email route returns `503 Password reset email service is not configured`

#### Symptoms

- frontend email route logs or response shows config missing

#### Likely causes

- one or more SMTP env variables are empty
- sender email is missing

#### What to check

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `MAILER_FROM_EMAIL`

#### Fix

- fill all required SMTP env values
- if using Gmail, use an App Password

### 7. Render build fails with missing `@types/*` or `process` / `express` type errors

#### Symptoms

- backend build fails on Render
- TypeScript reports missing `@types/express`, `@types/node`, or similar

#### Likely causes

- dev dependencies were not installed during build

#### What to check

- Render build command
- presence of `server/.npmrc`

#### Fix

- keep `server/.npmrc` with `include=dev`
- or use `npm install --include=dev && npm run build`

### 8. `req.auth` type errors during local backend development

#### Symptoms

- TypeScript says `Property 'auth' does not exist on type Request`

#### Likely causes

- `ts-node` did not load the Express augmentation file

#### What to check

- `server/tsconfig.json`
- `ts-node.files` setting

#### Fix

- keep `"ts-node": { "files": true }` in the backend `tsconfig.json`

### 9. MongoDB connection fails at startup

#### Symptoms

- backend process exits on startup
- logs show `MONGODB_URI is not configured` or connection errors

#### Likely causes

- missing URI
- invalid credentials
- blocked network or Atlas IP allowlist issue

#### What to check

- `MONGODB_URI`
- database network rules
- Render outbound network constraints if relevant

#### Fix

- correct the URI
- allow the host to reach MongoDB
- retry startup after config fix

### 10. Hydration mismatch warnings in frontend dev

#### Symptoms

- console warning about server/client markup mismatch

#### Likely causes

- theme attribute mismatch
- browser extension injecting attributes
- client-only state read too early

#### What to check

- root layout theme script
- whether a browser extension injected extra attributes

#### Fix

- keep the theme bootstrapping logic in `layout.tsx`
- use hydration suppression where appropriate
- test once without extensions if the warning references extension-added attributes

## Failure scenarios and current behavior

### Backend asleep

Current behavior:

- frontend request times out or gets a sleepy status
- frontend warms `/health`
- request may retry once
- user sees a friendly wake-up message instead of a raw network failure

### Session expired

Current behavior:

- backend `requireAuth` cannot resolve the session
- cookie is cleared
- backend returns `401`
- frontend redirects or shows auth-required state

### User deleted while session still exists

Current behavior:

- backend removes the stale session during session lookup
- request becomes unauthenticated

### Gemini temporarily unavailable

Current behavior:

- backend maps provider error to a friendlier `ApiError`
- frontend shows inline error and/or toast

### Reset token expired

Current behavior:

- backend returns `400`
- user must request a new reset link

### Chat session ID not found

Current behavior:

- history request returns empty history
- rename/delete request returns `404`

## Current limitations

### Architectural limitations

- the frontend proxy is intentionally narrow and currently only supports the request methods the app needs
- the proxy implementation is path-oriented and simple by design
- there is no background job queue for email or long-running async tasks
- password reset email delivery depends on the frontend deployment being healthy

### Product limitations

- memory is heuristic and not semantically retrieved
- remembered notes are compact and intentionally bounded
- old context is summarized, not replayed verbatim forever

### Security limitations to be aware of

- there is no dedicated CSRF token layer today
- cookie/proxy behavior should be regression-tested any time auth transport changes
- secrets are env-driven and must be managed carefully across both apps

## Best practices when extending the project

### If you add a new protected backend route

Checklist:

- add validation
- decide whether `requireAuth` is needed
- add a typed client method in `frontend/lib/api.ts`
- decide which Zustand store should own the request
- test through the proxy, not with a direct browser call
- update docs

### If you change auth or cookie behavior

Checklist:

- test login
- refresh after login
- test `/auth/me`
- test logout
- test deployed frontend against deployed backend

### If you change the reset email flow

Checklist:

- test local preview mode
- test real SMTP delivery
- verify the shared secret matches on both sides
- verify the reset link points to the right frontend auth page

### If you change the AI model or prompt logic

Checklist:

- confirm the model name is valid for your Gemini access
- test a normal reply
- test a long conversation
- test memory extraction
- test provider failure messaging

## Safe debugging checklist

Before changing code, collect:

- the failing request path
- request method
- response status
- response body
- browser console message
- relevant backend log line
- relevant env values involved in the flow

That usually reveals whether the issue is:

- frontend state
- proxy transport
- backend auth
- database connectivity
- provider configuration
- SMTP configuration

## Quick reference: where to inspect by symptom

| Symptom | First place to inspect |
| --- | --- |
| Login loop / immediate 401 | Browser Network tab for `/auth/login` and `/auth/me` |
| CORS error | Frontend request URL and backend `CLIENT_ORIGINS` |
| Chat fails | Backend chat logs and Gemini env |
| Reset email fails | Frontend email route env and backend bridge config |
| Backend build fails on host | Host build command and `server/.npmrc` |
| Theme/hydration warning | `frontend/app/layout.tsx` and browser extensions |

## Final advice

In this codebase, the most fragile areas are:

- auth cookie persistence
- proxy configuration
- reset email bridge alignment
- Gemini env/model configuration

If something breaks in production, start there first.
