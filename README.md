# Lovique

Lovique is a full-stack AI companion chat product with a polished web frontend and a modular Express backend.

It includes:

- a product-style landing page
- account registration, login, logout, and password recovery
- a private chat dashboard with saved conversations
- companion gender and personality preferences
- persistent remembered notes across chats
- a separate settings page for account and companion controls
- friendly handling for sleeping-server and AI-provider failures

## Project structure

```text
LoviqueAiBot/
|- frontend/   Next.js app
`- server/     Express + TypeScript API
```

Detailed setup lives here:

- [Frontend README](./frontend/README.md)
- [Server README](./server/README.md)

Product and architecture documentation lives here:

- [Documentation Hub](./docs/README.md)
- [Product Overview](./docs/product-overview.md)
- [Technical Architecture](./docs/technical-architecture.md)

## Product overview

Lovique is designed to feel like a real product rather than a demo app. Users can sign up, choose the kind of companion they want, chat in a private workspace, return to saved sessions later, and update their preferences from a dedicated settings area.

The frontend handles the product UI, navigation, theme switching, dashboard experience, and the password-reset email bridge. The backend handles authentication, session cookies, chat sessions, memory storage, and Gemini-powered replies.

## Main features

- market-style landing page and auth flow
- dashboard with recent conversations and session management
- long-term memory support through remembered notes
- light and dark theme toggle
- protected settings page for preferences and password changes
- password reset flow using a Next.js email route with SMTP
- modular backend structure for auth and chat

## Tech stack

Frontend:

- Next.js 16
- React 19
- Zustand
- Tailwind CSS 4
- Nodemailer

Backend:

- Express 5
- TypeScript
- MongoDB + Mongoose
- Google Gemini API

## Quick start

1. Install frontend dependencies:

```bash
cd frontend
npm install
```

2. Install server dependencies:

```bash
cd ../server
npm install
```

3. Add env files for both apps:

- `frontend/.env` or `frontend/.env.local`
- `server/.env`

Use the examples in:

- [frontend/.env.example](./frontend/.env.example)
- [server/.env.example](./server/.env.example)

4. Start the backend:

```bash
cd server
npm run dev
```

5. Start the frontend:

```bash
cd frontend
npm run dev
```

6. Open:

```text
http://localhost:3000
```

## Local app URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8002/api/v1`
- Health check: `http://localhost:8002/api/v1/health`

## Password reset email flow

Lovique uses a split password-reset setup:

1. The backend creates the reset token and reset URL.
2. The backend calls the frontend email bridge.
3. The Next.js API route sends the email through SMTP.

This keeps SMTP credentials on the frontend deployment side when needed.

## Repo notes

- frontend-specific documentation is in [frontend/README.md](./frontend/README.md)
- backend-specific documentation is in [server/README.md](./server/README.md)
- the project currently builds successfully on both sides

## Developer

Built by `@Amankanojiya27`
