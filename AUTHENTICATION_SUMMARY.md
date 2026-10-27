# Authentication System

## Current behavior

- Public registration creates standard user accounts only.
- Registration sends a 24-hour email verification link. Unverified accounts cannot sign in.
- Login issues a seven-day HTTP-only JWT cookie after checking the password, account verification status, and selected portal.
- Password reset links are sent by email, expire after 30 minutes, and can be used once.
- Passwords must contain at least 10 characters, including lowercase, uppercase, and numeric characters.
- Admin and officer API endpoints enforce their required roles on the backend. Frontend route checks are an additional usability layer.
- Admin accounts must be provisioned through a trusted administrative process; the public signup form cannot assign elevated roles.

## Email setup

Set `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`, and `FRONTEND_URL` in `backend/.env`. Use a verified sender address and an SMTP app password where required. Registration and password recovery return an explicit delivery error when mail sending fails; users can retry verification from the resend-verification page.

## Auth endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/verify-email/<token>`
- `POST /api/auth/resend-verification`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

There are no built-in demo accounts. Provision test or administrator accounts only in a controlled environment.
