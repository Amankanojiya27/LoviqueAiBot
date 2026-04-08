# Workflows and Sequence Diagrams

## Purpose of this document

This document explains the main runtime workflows in Lovique using step-by-step descriptions, diagrams, and concrete examples.

Use it when you want to understand:

- what happens after a user clicks a button
- how frontend and backend coordinate
- where data is stored
- where failures can happen

## 1. App boot and session hydration

Use case:

- a user opens `/dashboard` or `/settings`
- the app needs to determine whether they are still signed in

```mermaid
sequenceDiagram
  participant User
  participant Browser
  participant AppShell
  participant Proxy as Next.js proxy
  participant API as Express API

  User->>Browser: open /dashboard
  Browser->>AppShell: mount protected shell
  AppShell->>Proxy: GET /api/proxy/auth/me
  Proxy->>API: GET /api/v1/auth/me with cookie
  API-->>Proxy: 200 user or 401
  Proxy-->>AppShell: response
  AppShell-->>Browser: render dashboard, auth gate, or wake-up state
```

### Logic summary

1. `AppShell` mounts for protected routes.
2. It calls `authStore.loadCurrentUser()`.
3. The frontend API client calls `/api/proxy/auth/me`.
4. The proxy forwards the cookie to the backend.
5. The backend checks the session through `requireAuth`.
6. If valid, the user is returned.
7. If invalid, the frontend renders the auth-required state.
8. If the backend is sleeping or unavailable, the wake-up state is shown.

### Important files

- `frontend/components/app-shell.tsx`
- `frontend/stores/auth-store.ts`
- `frontend/lib/api.ts`
- `server/src/middleware/auth.middleware.ts`
- `server/src/modules/auth/auth.service.ts`

### Common failure points

- cookie missing
- proxy target misconfigured
- backend asleep
- session expired and cookie cleared

## 2. Registration flow

Use case:

- a new user creates an account from `/auth?mode=register`

```mermaid
sequenceDiagram
  participant User
  participant AuthUI as AuthShell/AuthPanel
  participant AuthStore
  participant Proxy as Next.js proxy
  participant API as Express API
  participant DB as MongoDB

  User->>AuthUI: submit register form
  AuthUI->>AuthStore: register(input)
  AuthStore->>Proxy: POST /api/proxy/auth/register
  Proxy->>API: POST /api/v1/auth/register
  API->>DB: check email uniqueness
  API->>DB: create User
  API->>DB: create Session
  API-->>Proxy: 201 + Set-Cookie + user
  Proxy-->>AuthStore: 201 + Set-Cookie + user
  AuthStore-->>AuthUI: user saved in store
  AuthUI-->>User: navigate to /dashboard
```

### Validation rules that matter

- `name` must be present and within length bounds
- `email` must be valid
- `password` must be strong enough
- `companionGender` must be allowed
- `companionPersonality` must be allowed
- `isAdultConfirmed` must be `true`

### Example request

```json
{
  "name": "Aman",
  "email": "test@example.com",
  "companionGender": "female",
  "companionPersonality": "sweet",
  "password": "Hello@123",
  "isAdultConfirmed": true
}
```

### Example success response

```json
{
  "success": true,
  "message": "Account created successfully.",
  "data": {
    "user": {
      "id": "user-id",
      "name": "Aman",
      "email": "test@example.com",
      "companionGender": "female",
      "companionPersonality": "sweet",
      "createdAt": "2026-04-08T00:00:00.000Z",
      "updatedAt": "2026-04-08T00:00:00.000Z",
      "lastLoginAt": "2026-04-08T00:00:00.000Z"
    }
  }
}
```

### Important files

- `frontend/components/auth-shell.tsx`
- `frontend/components/auth-panel.tsx`
- `frontend/stores/auth-store.ts`
- `server/src/modules/auth/auth.validation.ts`
- `server/src/modules/auth/auth.controller.ts`
- `server/src/modules/auth/auth.service.ts`

## 3. Login flow

Use case:

- a returning user signs in

```mermaid
sequenceDiagram
  participant User
  participant AuthUI as AuthShell/AuthPanel
  participant AuthStore
  participant Proxy as Next.js proxy
  participant API as Express API
  participant DB as MongoDB

  User->>AuthUI: submit email/password
  AuthUI->>AuthStore: login(input)
  AuthStore->>Proxy: POST /api/proxy/auth/login
  Proxy->>API: POST /api/v1/auth/login
  API->>DB: find user by email
  API->>API: verify password hash
  API->>DB: create Session
  API-->>Proxy: 200 + Set-Cookie + user
  Proxy-->>AuthStore: 200 + Set-Cookie + user
  AuthStore-->>AuthUI: save user
  AuthUI-->>User: redirect to /dashboard
```

### Important edge cases

- wrong password returns `401`
- missing session cookie persistence will lead to later `401` on `/auth/me`
- cross-host cookie problems are reduced by the proxy but still depend on correct env and headers

## 4. Forgot password and reset password flow

There are two runtime variants:

- local preview flow for development
- live email flow for deployed environments

```mermaid
sequenceDiagram
  participant User
  participant AuthUI as AuthShell
  participant Proxy as Next.js proxy
  participant API as Express API
  participant DB as MongoDB
  participant EmailRoute as Next.js email route
  participant SMTP as SMTP provider

  User->>AuthUI: submit forgot-password email
  AuthUI->>Proxy: POST /api/proxy/auth/forgot-password
  Proxy->>API: POST /api/v1/auth/forgot-password
  API->>DB: store reset token hash + expiry

  alt local preview mode
    API-->>Proxy: 200 + preview token and reset URL
    Proxy-->>AuthUI: preview response
  else live email mode
    API->>EmailRoute: POST shared-secret + reset data
    EmailRoute->>SMTP: send reset email
    EmailRoute-->>API: success/failure
    API-->>Proxy: 200 generic success message
    Proxy-->>AuthUI: generic success message
  end
```

### Local preview mode

Preview mode is only enabled when:

- `NODE_ENV=development`
- `APP_URL` points to localhost or `127.0.0.1`

This is useful because it allows local testing without real email delivery.

### Live mode

In live mode:

1. backend creates token and expiry
2. backend builds reset URL for `/auth?mode=reset&token=...`
3. backend calls the frontend email route with a shared secret
4. frontend email route sends the email using SMTP

### Reset completion flow

```mermaid
sequenceDiagram
  participant User
  participant AuthUI as AuthShell
  participant Proxy as Next.js proxy
  participant API as Express API
  participant DB as MongoDB

  User->>AuthUI: submit token + new password
  AuthUI->>Proxy: POST /api/proxy/auth/reset-password
  Proxy->>API: POST /api/v1/auth/reset-password
  API->>DB: find user by token hash and expiry
  API->>DB: update password hash and salt
  API->>DB: delete all sessions for user
  API-->>Proxy: 200 success
  Proxy-->>AuthUI: 200 success
  AuthUI-->>User: return to login
```

### Important edge cases

- missing SMTP env returns `503` from the email route
- invalid or expired reset token returns `400`
- production should not expose local preview values

## 5. Chat message flow

Use case:

- an authenticated user sends a message in the dashboard

```mermaid
sequenceDiagram
  participant User
  participant UI as DashboardShell/WorkspacePanel
  participant ChatStore
  participant Proxy as Next.js proxy
  participant API as Express API
  participant DB as MongoDB
  participant Gemini

  User->>UI: type message and submit
  UI->>ChatStore: sendMessage(text)
  ChatStore-->>UI: optimistic user message shown
  ChatStore->>Proxy: POST /api/proxy/chat/messages
  Proxy->>API: POST /api/v1/chat/messages
  API->>DB: load ChatSession and User
  API->>API: build prompt history + system instruction + memory
  API->>Gemini: generate reply
  Gemini-->>API: reply text
  API->>DB: save session history and updated memories
  API-->>Proxy: reply + history + session summary + memories
  Proxy-->>ChatStore: result
  ChatStore-->>UI: replace optimistic state with canonical server state
```

### What the backend actually does

1. Load or create a `ChatSession`.
2. Load the current `User`.
3. Extract potential memory updates from the new message.
4. Build:
   - compact long-term memory block
   - compact conversation memory block
   - trimmed prompt history
   - system instruction based on personality and companion gender
5. Call Gemini.
6. Save user message and model reply.
7. Save updated memory if anything changed.
8. Return:
   - reply text
   - canonical history
   - persistent memories
   - session summary

### Example request

```json
{
  "sessionId": "c80f4ff3-f966-410a-bcf5-d49b1a14b30b",
  "message": "Remember that I love chai after work."
}
```

### Example response shape

```json
{
  "success": true,
  "message": "Reply generated successfully.",
  "data": {
    "sessionId": "c80f4ff3-f966-410a-bcf5-d49b1a14b30b",
    "reply": "That sounds like a perfect evening ritual.",
    "history": [
      { "role": "user", "parts": "Remember that I love chai after work." },
      { "role": "model", "parts": "That sounds like a perfect evening ritual." }
    ],
    "persistentMemories": [
      {
        "id": "likes-chai-after-work",
        "fact": "Loves chai after work",
        "createdAt": "2026-04-08T00:00:00.000Z",
        "updatedAt": "2026-04-08T00:00:00.000Z"
      }
    ],
    "session": {
      "sessionId": "c80f4ff3-f966-410a-bcf5-d49b1a14b30b",
      "title": "Remember that I love chai after work",
      "messageCount": 2,
      "lastMessage": "That sounds like a perfect evening ritual.",
      "createdAt": "2026-04-08T00:00:00.000Z",
      "updatedAt": "2026-04-08T00:00:00.000Z"
    }
  }
}
```

### Important edge cases

- Gemini config missing returns a user-friendly `503`
- provider rate limits return `429`
- provider/network issues return a user-friendly temporary-unavailable message
- optimistic UI is rolled back on failure

## 6. Conversation management flow

Use cases:

- load recent sessions
- reopen one session
- rename a session
- delete a session
- start a new session

### Load sessions

1. `AppShell` calls `chatStore.loadSessions()` once a user is available.
2. The backend returns session summaries sorted by `updatedAt`.
3. The left sidebar shows the newest five sessions.

### Open a session

1. User clicks a session in the sidebar.
2. `chatStore.openSession(sessionId)` updates the active session ID.
3. `DashboardShell` reacts to session ID change and reloads history.

### Rename a session

1. User clicks the inline rename action.
2. Sidebar enters local edit mode.
3. `chatStore.renameSession()` calls the backend.
4. Returned summary replaces the existing one in store.

### Delete a session

1. User clicks delete.
2. Sidebar shows inline confirmation.
3. `chatStore.deleteSession()` calls the backend.
4. The store removes the session locally.
5. If the deleted session was active, a fresh session ID is generated.

## 7. Memory extraction and reuse flow

Use case:

- a user shares facts that should matter later

```mermaid
flowchart TD
  Msg[New user message] --> Extract[Regex-based memory extraction]
  Extract --> Merge[Merge with existing memory facts]
  Merge --> Store[Save on user document]
  Store --> Build[Build compact memory block]
  Build --> Prompt[Inject into Gemini system instruction]
```

### Current memory behavior

- only recognized patterns are saved
- duplicate facts are collapsed
- only a bounded number of facts are stored
- only a bounded number of facts are inserted into prompts

### Good use-case examples

- "Remember that I love chai."
- "My favorite color is green."
- "I live in Jaipur."
- "Call me Aman."
- "I work as a designer."

## 8. Wake-up and retry flow

Use case:

- frontend hits a sleeping or temporarily unavailable backend

```mermaid
flowchart TD
  Start[Frontend request] --> Try[Normal fetch with timeout]
  Try -->|Success| Done[Return response]
  Try -->|Timeout or sleepy status| Warm[Call /api/proxy/health]
  Warm -->|Health OK| Retry[Retry original request once]
  Retry -->|Success| Done
  Retry -->|Fail| Friendly[Show friendly wake-up or temporary outage message]
  Warm -->|Health fail| Friendly
```

### Why this matters

This flow reduces rough edges on hosts that sleep the backend after inactivity.

Instead of showing raw network failures, the UI can say:

- Lovique is waking up
- Lovique needs a moment
- Lovique is temporarily unavailable

### Important files

- `frontend/lib/api.ts`
- `frontend/lib/error-helpers.ts`
- `frontend/stores/toast-store.ts`
- `frontend/components/app-shell.tsx`
- `server/src/app.ts`

## Summary

The most important workflows in Lovique all follow the same pattern:

1. UI component triggers a Zustand action.
2. Zustand action calls the frontend API client.
3. Frontend API client uses the same-origin proxy.
4. Express validates, authenticates, and performs business logic.
5. MongoDB and Gemini are used as needed.
6. The result returns through the proxy.
7. Store state updates drive the UI.

That consistent layering is one of the biggest strengths of the current implementation.
