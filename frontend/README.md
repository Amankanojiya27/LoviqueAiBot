# Lovique Frontend

Next.js frontend for Lovique. This app contains the landing page, auth flow, dashboard, settings page, shared app shell, and the password-reset email API route.

## Stack

- Next.js 16
- React 19
- Zustand
- Tailwind CSS 4
- Nodemailer for password-reset email delivery

## Main routes

- `/` landing page
- `/auth` login, register, forgot password, reset password
- `/dashboard` chat workspace
- `/settings` account, preferences, password, memories
- `/api/email/reset-password` internal email-sending route used by the backend

## Environment variables

Create `frontend/.env` or `frontend/.env.local`.

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8002/api/v1

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_SECURE=true

MAILER_FROM_EMAIL=your@gmail.com
MAILER_FROM_NAME=Lovique
PASSWORD_RESET_EMAIL_SECRET=choose-a-shared-secret
```

Notes:

- `SMTP_PASS` should be a Gmail App Password, not your normal Gmail password.
- `PASSWORD_RESET_EMAIL_SECRET` must match the backend value exactly.
- `NEXT_PUBLIC_API_BASE_URL` should point to the Express API.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Local development

1. Install dependencies:

```bash
npm install
```

2. Add your frontend env file.

3. Start the frontend:

```bash
npm run dev
```

4. Make sure the backend is also running on the API URL set in `NEXT_PUBLIC_API_BASE_URL`.

## Password reset email flow

Lovique does not send reset emails from the Express server directly.

Flow:

1. The backend creates the reset token and reset URL.
2. The backend calls the frontend email bridge.
3. The Next.js route at `/api/email/reset-password` sends the email through SMTP.

This keeps SMTP credentials on the frontend deployment side when needed.

## Useful files

- `app/page.tsx` home page
- `app/auth/page.tsx` auth page
- `app/dashboard/page.tsx` dashboard page
- `app/settings/page.tsx` settings page
- `app/api/email/reset-password/route.ts` reset email sender
- `components/app-shell.tsx` shared app navigation
- `stores/auth-store.ts` auth state
- `stores/chat-store.ts` chat state

## Build status

The frontend currently builds successfully with:

```bash
npm run lint
npm run build
```
