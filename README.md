# Honest-Feedback

Anonymous feedback platform built with Next.js, TypeScript, MongoDB, and NextAuth.

People can share feedback through a public user link, and account owners can manage, summarize, and export feedback from a private dashboard.

## What is included

- Email + username credential authentication with NextAuth
- Sign up with email verification code flow
- Password reset flow with verification code and resend support
- Public feedback page per user: `/u/[username]`
- Free-text feedback and structured question-based feedback
- Dashboard message controls: mark read, pin/unpin, delete
- Feedback filtering and search (all, unread, pinned)
- CSV/JSON export for feedback history
- Share profile URL + QR code from dashboard
- Optional email notification toggle for new feedback
- AI message ideas generation via Groq (`/api/suggest-messages`)
- AI feedback summaries via Groq (`/api/summarize-messages`)
- Demo login seeding (`demo` account) for quick exploration
- Light/dark theme toggle

## Tech stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui + Radix UI
- NextAuth (Credentials provider)
- MongoDB + Mongoose
- Zod + React Hook Form
- Nodemailer (Gmail SMTP)
- Groq SDK (LLM-backed suggestions/summaries)

## Quick start

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Create/update `.env` with the following values:

```env
MONGODB_URI=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

EMAIL_USER=
EMAIL_PASS=

GROQ_API_KEY=
```

Notes:

- `NEXTAUTH_SECRET`: generate one using `openssl rand -base64 32`
- `EMAIL_PASS`: use a Gmail App Password (not your Gmail account password)
- `GROQ_API_KEY`: required for AI suggestions and summaries

### 3) Run development server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` - Start local development server
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - Run linting
- `npm run postinstall` - Applies SWC patch when available

Optional container/build helper:

- `build.sh` installs dependencies, applies SWC patch, and runs build

## Main product flows

### Account and auth

1. User signs up with username/email/password
2. Verification code is emailed
3. User verifies account
4. User signs in via credentials (email or username + password)

### Password reset

1. User requests reset using email or username
2. Verification code is emailed
3. User verifies code and sets new password
4. Optional resend verification code supported

### Feedback collection

1. Sender opens `/u/[username]`
2. If recipient has custom questions, sender fills structured answers
3. Otherwise sender submits free-text feedback
4. Recipient can receive email notifications (toggle in dashboard)

### Dashboard management

- Toggle feedback acceptance on/off
- Manage custom feedback questions (up to 10, reorder, required flags)
- Search and filter feedback
- Mark messages as read
- Pin/unpin important messages
- Delete messages
- Export messages as CSV/JSON
- Generate AI summaries grouped by question/theme

## API overview

### Auth and account

- `POST /api/sign-up`
- `POST /api/verify-code`
- `POST /api/resend-verification`
- `POST /api/reset-password/request`
- `POST /api/reset-password/verify`
- `GET /api/check-username-unique`
- `GET /api/check-username-status`
- `POST /api/demo-login`
- `GET|POST /api/auth/[...nextauth]`

### Feedback and dashboard

- `GET|POST /api/accept-messages`
- `GET /api/check-message-eligibility`
- `POST /api/send-message`
- `GET /api/get-messages`
- `DELETE /api/delete-message/[messageId]`
- `PATCH /api/messages/[id]/read`
- `PATCH /api/messages/[id]/pin`
- `PUT /api/update-preferences`
- `GET|PUT /api/questions`
- `GET /api/export-messages`

### AI features

- `POST /api/suggest-messages`
- `POST /api/summarize-messages`

## Project structure (high level)

- `src/app/(auth)` - Sign in/up, verify, password reset pages
- `src/app/(app)` - Home, dashboard, and public user feedback page
- `src/app/api` - Route handlers for auth, feedback, AI, and preferences
- `src/components` - UI and dashboard components
- `src/model/User.ts` - Mongoose schemas for users/messages/questions
- `src/helpers/sendVerificationEmail.ts` - Email helper

## Deployment notes

- Ensure all required environment variables are set in your hosting provider
- Set `NEXTAUTH_URL` to your deployed base URL
- Keep `NEXTAUTH_SECRET`, email credentials, and AI keys private

---

If you are onboarding quickly, start with:

1. Sign up and verify account
2. Open dashboard and copy your profile link
3. Send test feedback from an incognito window
4. Try pin/read/export/summary features
