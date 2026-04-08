<!-- File: docs/module-reference.md -->
# Module Reference

## Purpose of this document

This document maps the most important modules, exported functions, and dependencies in Lovique.

It is intended for developers who want to answer questions like:

- Where should I make this change?
- Which file owns this workflow?
- What does this function do?
- What depends on this module?

This reference focuses on exported functions and the important internal responsibilities behind them. It does not document every tiny UI helper or SVG icon, but it does cover the modules that shape product behavior.

## Backend reference

### Bootstrap and configuration

| File | Key exports / entry points | Responsibility | Depends on |
| --- | --- | --- | --- |
| `server/src/server.ts` | startup entry | Connect database and start the HTTP server | `app.ts`, `config/database.ts`, `config/env.ts` |
| `server/src/app.ts` | default Express app | Configure CORS, logging, parsing, health routes, auth routes, chat routes, and terminal middleware | `cors`, `morgan`, env, auth/chat routes, middleware |
| `server/src/config/env.ts` | `env`, `isProduction` | Normalize environment variables and expose safe defaults | `dotenv` |
| `server/src/config/database.ts` | `connectDB()` | Open the MongoDB connection and fail fast when config is missing | `mongoose`, `env` |
| `server/src/constants/auth.ts` | cookie names/options, TTL constants | Central auth/session timing and cookie behavior | `config/env.ts` |

#### Notable implementation details

- `server.ts` sets Google DNS servers in development only.
- `app.ts` skips Morgan logging for health endpoints.
- `env.ts` treats empty strings as missing values so defaults still work.

### Auth module

#### `profile.constants.ts`

| Export | Purpose |
| --- | --- |
| `USER_GENDERS` | Allowed companion gender values |
| `COMPANION_PERSONALITY_OPTIONS` | Personality labels, summaries, and AI prompt instructions |
| `COMPANION_PERSONALITY_KEYS` | Allowed personality keys |
| `DEFAULT_COMPANION_GENDER` | Default fallback gender |
| `DEFAULT_COMPANION_PERSONALITY` | Default fallback personality |
| `getCompanionGenderForUser()` | Legacy compatibility helper for older user data |

Why it matters:

- keeps product options centralized
- backend prompt logic and frontend form options stay aligned through shared values and mirrored frontend helpers

#### `auth.types.ts`

| Export | Purpose |
| --- | --- |
| `PublicUser` | Safe user shape returned to the frontend |
| `PersistentMemory` | Serialized memory item shape |
| `AuthRequestContext` | Request-scoped authenticated user plus current session ID |

#### `auth.validation.ts`

| Export | Purpose |
| --- | --- |
| `validateRegisterPayload()` | Validates signup payload, including password strength and adult confirmation |
| `validateLoginPayload()` | Validates login payload |
| `validateForgotPasswordPayload()` | Validates forgot-password payload |
| `validateResetPasswordPayload()` | Validates reset token and new password |
| `validateChangePasswordPayload()` | Validates current/new password change payload |
| `validateUpdatePreferencesPayload()` | Validates companion preference updates |

Dependencies:

- `utils/validate.ts`
- `utils/apiError.ts`
- `profile.constants.ts`

#### `auth.controller.ts`

These functions are the HTTP boundary for auth:

| Export | Route role | Main responsibility |
| --- | --- | --- |
| `register` | `POST /auth/register` | Validate signup, create account, set session cookie |
| `login` | `POST /auth/login` | Validate credentials, create session cookie |
| `logout` | `POST /auth/logout` | Delete server session and clear cookie |
| `me` | `GET /auth/me` | Return current authenticated user |
| `forgotPassword` | `POST /auth/forgot-password` | Generate reset flow result or preview |
| `resetUserPassword` | `POST /auth/reset-password` | Apply reset token and clear cookie |
| `changePassword` | `POST /auth/change-password` | Change password while authenticated |
| `updatePreferences` | `PATCH /auth/preferences` | Save companion settings |
| `getMemories` | `GET /auth/memories` | Load remembered notes |
| `clearMemories` | `DELETE /auth/memories` | Remove remembered notes |

Controller pattern:

- validate request
- read `req.auth` when needed
- call service
- shape JSON response
- set or clear cookie where appropriate

#### `auth.service.ts`

This file contains the real auth business logic.

Public exports:

| Export | Purpose | Main dependencies |
| --- | --- | --- |
| `getPublicUserById()` | Load and serialize user | `User` model |
| `registerUser()` | Create account and first session | validation payload, `User`, `Session`, crypto helpers |
| `loginUser()` | Verify credentials and create session | `User`, `Session`, crypto helpers |
| `logoutUser()` | Delete session by token | `Session` model |
| `getSessionContextFromToken()` | Resolve cookie token into authenticated context | `Session`, `User`, serialization helpers |
| `initiatePasswordReset()` | Generate reset token, store hash, optionally send email or return preview | `User`, crypto helpers, email bridge |
| `resetPassword()` | Validate token and set new password | `User`, `Session`, crypto helpers |
| `changePasswordForUser()` | Change password while keeping current session | `User`, `Session`, crypto helpers |
| `updateUserPreferences()` | Persist companion settings | `User` model |
| `getUserMemoriesById()` | Serialize memory facts for the frontend | `User`, memory helpers |
| `clearUserMemoriesById()` | Remove stored memory facts | `User` model |

Important internal helpers in the same file:

| Helper | Why it matters |
| --- | --- |
| `sendPasswordResetEmail()` | Calls the frontend email bridge instead of sending mail directly from Express |
| `applyProfileDefaults()` | Keeps legacy users compatible with the newer companion preference model |
| `serializeUser()` | Defines the user contract the frontend receives |
| `createSession()` | Central session creation logic and metadata capture |

Important design details:

- account and password recovery logic lives here, not in controllers
- only hashed session tokens and reset tokens are stored
- local reset preview is intentionally restricted to local development conditions

#### `user.model.ts`

Role:

- persistent user data
- password and reset fields
- companion preferences
- embedded memory facts

Important schema details:

- unique email
- companion gender/personality enums
- timestamps enabled
- embedded `memoryFacts` subdocuments

#### `session.model.ts`

Role:

- server-side session persistence

Important schema details:

- TTL cleanup on `expiresAt`
- unique `tokenHash`
- indexed `userId`

#### `user.memory.ts`

Public exports:

| Export | Purpose |
| --- | --- |
| `normalizeUserMemories()` | Validate and sort stored memory entries |
| `mergeUserMemories()` | Extract new memory candidates from a message and merge them into stored memory |
| `buildPersistentMemoryBlock()` | Create the short memory text block inserted into the AI prompt |
| `serializePersistentMemories()` | Convert stored memory entries into API response shape |

Important internal behavior:

- regex-based extraction from user messages
- duplicate suppression by normalized ID or fact
- hard limits on total stored and prompt-injected memory items

Common memory patterns recognized today:

- `remember ...`
- `my name is ...`
- `call me ...`
- `my favorite ... is ...`
- `i live in ...`
- `i work as ...`
- `i study ...`
- `i like/love/enjoy ...`
- `i don't like/dislike/hate ...`

### Chat module

#### `chat.types.ts`

| Export | Purpose |
| --- | --- |
| `ChatMessage` | One chat message entry with `role` and `parts` |
| `ChatSessionSummary` | Lightweight session summary for sidebar and lists |

#### `chat.validation.ts`

| Export | Purpose |
| --- | --- |
| `validateSendMessagePayload()` | Validate message send request |
| `validateSessionIdParam()` | Validate a session ID used in params or body |
| `validateUpdateSessionPayload()` | Validate rename payload |

#### `chat.controller.ts`

| Export | Route role | Main responsibility |
| --- | --- | --- |
| `postMessage` | `POST /chat/messages` | Validate message request, require auth, return reply/history/session |
| `history` | `GET /chat/sessions/:sessionId` | Load stored history for one session |
| `listSessions` | `GET /chat/sessions` | Return session summaries |
| `updateSession` | `PATCH /chat/sessions/:sessionId` | Rename a session |
| `removeSession` | `DELETE /chat/sessions/:sessionId` | Delete a session |

#### `chat.service.ts`

This is the core AI orchestration file.

Public exports:

| Export | Purpose | Main dependencies |
| --- | --- | --- |
| `sendChatMessage()` | Generate a reply, persist session history, update memory, and return the updated session summary | Gemini client, `User`, `ChatSession`, memory helpers |
| `getChatHistory()` | Return full stored history for one session | `ChatSession` |
| `listChatSessions()` | Return recent session summaries sorted by update time | `ChatSession` |
| `renameChatSession()` | Rename a session with truncation limits | `ChatSession` |
| `deleteChatSession()` | Delete a session | `ChatSession` |

Important internal helpers in the same file:

| Helper | Why it matters |
| --- | --- |
| `getClient()` | Initializes Gemini client lazily and fails safely when the key is missing |
| `toProviderApiError()` | Maps raw provider errors into safer `ApiError` responses |
| `buildAutoTitle()` | Creates a fallback chat title from the first user message |
| `buildSessionSummary()` | Converts full session data into lightweight UI summary data |
| `buildConversationMemory()` | Compresses older messages into a small memory block |
| `buildPromptHistory()` | Chooses and trims the recent history sent to Gemini |
| `buildSystemInstruction()` | Assembles the AI persona and memory prompt |

Why this file is important:

- it determines how the AI behaves
- it controls token usage
- it owns provider failure translation
- it is the main backend differentiator of the product

#### `chat.model.ts`

Role:

- persistent chat session storage

Important schema details:

- unique `(userId, sessionId)` pair
- embedded history array
- nullable title
- timestamps enabled

### Middleware and shared utilities

| File | Export(s) | Role |
| --- | --- | --- |
| `middleware/auth.middleware.ts` | `requireAuth()` | Read session cookie, resolve session, attach `req.auth`, clear stale cookie |
| `middleware/error.middleware.ts` | `errorHandler` | Serialize operational errors and protect unknown failures |
| `middleware/notFound.middleware.ts` | `notFoundHandler` | JSON 404 fallback |
| `utils/asyncHandler.ts` | `asyncHandler()` | Wrap async Express handlers without repetitive try/catch |
| `utils/apiError.ts` | `ApiError` | Standard operational error type |
| `utils/cookies.ts` | `getCookieValue()`, `setSessionCookie()`, `clearSessionCookie()` | Central cookie read/write logic |
| `utils/crypto.ts` | `createRandomToken()`, `hashToken()`, `hashPassword()`, `verifyPassword()` | Security primitives for sessions and passwords |
| `utils/validate.ts` | `assertString()`, `normalizeEmail()`, `ensurePasswordStrength()`, `assertEnum()` | Shared request validation primitives |
| `types/express.d.ts` | request augmentation | Adds `req.auth` to Express request typing |

## Frontend reference

### Route entry points

| File | Responsibility |
| --- | --- |
| `frontend/app/page.tsx` | Landing page entry |
| `frontend/app/auth/page.tsx` | Auth page entry, wrapped in `Suspense` |
| `frontend/app/dashboard/page.tsx` | Dashboard entry |
| `frontend/app/settings/page.tsx` | Settings entry |
| `frontend/app/layout.tsx` | Root layout, fonts, theme bootstrapping, metadata, and `RouteShell` |

### Shell and page-level components

| File | Main role | Depends on |
| --- | --- | --- |
| `components/route-shell.tsx` | Route-aware wrapper that decides whether to render the persistent app shell | `usePathname`, `AppShell`, `ToastViewport` |
| `components/app-shell.tsx` | Protected app frame, sidebar, session boot, recent sessions, logout, mobile drawer | auth store, chat store, router, toast helpers |
| `components/auth-shell.tsx` | Auth page orchestration for mode switching and auth actions | auth store, router, toast helpers, `AuthPanel` |
| `components/dashboard-shell.tsx` | Dashboard controller for history loading and send-message UX | auth store, chat store, `WorkspacePanel` |
| `components/settings-shell.tsx` | Settings controller for preferences, password, and memories | auth store, chat store, `SettingsPanel` |
| `components/landing-page.tsx` | Public landing experience | static content, theme toggle, footer |

### Presentational panels

| File | Role |
| --- | --- |
| `components/auth-panel.tsx` | Actual auth forms and field widgets |
| `components/workspace-panel.tsx` | Chat transcript, compose box, busy/error states |
| `components/settings-panel.tsx` | Account details, memory list, preferences, password form |
| `components/auth-required-state.tsx` | Friendly protected-route gate |
| `components/toast-viewport.tsx` | Renders active toasts |
| `components/theme-toggle.tsx` | Theme switcher |
| `components/developer-footer.tsx` | Shared footer |
| `components/public-page-shell.tsx` | Public info page wrapper |

### Frontend state stores

#### `auth-store.ts`

| Method | Purpose |
| --- | --- |
| `loadCurrentUser()` | Hydrate session state via `/auth/me` |
| `register()` | Create account and save `user` in store |
| `login()` | Log in and save `user` in store |
| `logout()` | Log out and clear `user` and reset preview |
| `forgotPassword()` | Start password reset flow and store preview if available |
| `resetPassword()` | Complete password reset and clear local auth state |
| `changePassword()` | Update password for authenticated user |
| `updatePreferences()` | Save companion settings |
| `clearResetPreview()` | Remove local preview state |

State fields worth knowing:

- `user`
- `sessionBooting`
- `activeRequest`
- `resetPreview`

#### `chat-store.ts`

| Method | Purpose |
| --- | --- |
| `loadSessions()` | Load recent session summaries |
| `loadHistory()` | Load history for the active session |
| `loadMemories()` | Load remembered notes |
| `sendMessage()` | Optimistically add the user message, request the reply, and reconcile state |
| `openSession()` | Set active session ID and clear current transcript before reload |
| `renameSession()` | Rename a stored conversation |
| `deleteSession()` | Delete a conversation and reset active state if needed |
| `clearMemories()` | Clear remembered notes |
| `startFreshChat()` | Generate a new session ID and clear transcript |
| `resetState()` | Reset the whole chat state, usually after logout or missing session |

State fields worth knowing:

- `sessionId`
- `messages`
- `memories`
- `sessions`
- `chatBusy`
- `chatError`
- `activeRequest`

#### `toast-store.ts`

| Export | Purpose |
| --- | --- |
| `useToastStore` | Zustand store for active toasts |
| `showToast()` | Convenience function to push a toast from anywhere |

### Frontend libraries and internal APIs

#### `lib/api.ts`

Main exported pieces:

| Export | Purpose |
| --- | --- |
| `ApiRequestError` | Standard frontend request error type |
| `api` | High-level client for auth, chat, memory, and session routes |

Important behavior in this file:

- timeout-based fetch wrapper
- server warm-up ping
- one-time retry after wake-up
- generic server message translation
- 401 handling for `getCurrentUser()`

#### `lib/error-helpers.ts`

| Export | Purpose |
| --- | --- |
| `extractErrorMessage()` | Convert unknown errors to user-readable text |
| `isServiceToastWorthyError()` | Decide whether an error deserves a toast |
| `getServiceToastTitle()` | Generate consistent toast titles |

#### `lib/types.ts`

Defines the main shared frontend data contracts:

- auth modes
- user types
- register/login/reset/change payloads
- chat message and session summary shapes
- memory shapes

#### `lib/companion-preferences.ts`

Provides:

- companion gender options
- personality options
- label/description helpers used in UI text

#### `app/api/proxy/[...path]/route.ts`

Exported handlers:

- `GET`
- `POST`
- `PATCH`
- `DELETE`

Role:

- forward browser requests to the backend
- forward cookies and selected headers
- forward `Set-Cookie` back to the browser

#### `app/api/email/reset-password/route.ts`

Exported handler:

- `POST`

Role:

- validate shared secret
- validate SMTP config
- render email text and HTML
- send reset email via Nodemailer

## Dependency and ownership summary

If you are changing one of these concerns, start here:

| Concern | Primary files |
| --- | --- |
| Auth cookies and session persistence | `server/src/constants/auth.ts`, `server/src/utils/cookies.ts`, `server/src/middleware/auth.middleware.ts`, `frontend/app/api/proxy/[...path]/route.ts`, `frontend/lib/api.ts` |
| Signup / login UI | `frontend/components/auth-shell.tsx`, `frontend/components/auth-panel.tsx`, `frontend/stores/auth-store.ts` |
| Password reset | `server/src/modules/auth/auth.service.ts`, `frontend/app/api/email/reset-password/route.ts`, `frontend/components/auth-shell.tsx` |
| AI persona and reply behavior | `server/src/modules/chat/chat.service.ts`, `server/src/modules/auth/profile.constants.ts`, `server/src/modules/auth/user.memory.ts` |
| Saved conversations | `server/src/modules/chat/*`, `frontend/stores/chat-store.ts`, `frontend/components/app-shell.tsx`, `frontend/components/dashboard-shell.tsx` |
| Remembered notes | `server/src/modules/auth/user.memory.ts`, `server/src/modules/auth/auth.service.ts`, `frontend/stores/chat-store.ts`, `frontend/components/settings-shell.tsx` |
| Wake-up and temporary outage UX | `frontend/lib/api.ts`, `frontend/lib/error-helpers.ts`, `frontend/stores/toast-store.ts`, `frontend/components/app-shell.tsx`, `server/src/modules/chat/chat.service.ts` |
