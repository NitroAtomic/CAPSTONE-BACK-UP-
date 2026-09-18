# Backend API (Node.js + Express + MySQL)

**Web-Based Social Engineering Awareness Platform for Remote Workers**
Group 4 | Capstone 2

Backend and integration: IamAtomic
Database schema: Jyan Estanislao (see `sql/01-jyan-base-schema.sql`)

Runs against the `awareness_platform` database. Every endpoint was tested
against a real MySQL instance and through the actual frontend before being
committed, not written and assumed correct.

## Setup

The database is split into three files so Jyan's original schema stays
intact and reviewable, separate from what the backend needed added.

1. Install MySQL 8 (or MariaDB).
2. Run the three SQL files **in order**:
   ```
   mysql -u root < sql/01-jyan-base-schema.sql     # Jyan's schema, unmodified
   mysql -u root < sql/02-backend-additions.sql    # columns/tables the API needs
   mysql -u root < sql/03-seed.sql                 # the 10 modules + their quizzes
   ```
3. Create a database user for the app:
   ```sql
   CREATE USER 'seaware'@'localhost' IDENTIFIED BY 'your-password';
   GRANT ALL PRIVILEGES ON awareness_platform.* TO 'seaware'@'localhost';
   FLUSH PRIVILEGES;
   ```
4. Copy `.env.example` to `.env` and fill in that password plus a long
   random `JWT_SECRET`. Leave the `SMTP_*` fields blank for now.
5. Install and run:
   ```
   npm install
   npm start
   ```
   Runs on `http://localhost:3000`.
6. Create the first admin:
   ```sql
   UPDATE `user` SET role = 'admin' WHERE email = 'your@email.com';
   ```
   There is deliberately no self-service way to become an admin.

## What `02-backend-additions.sql` adds, and why

Jyan's schema matches the ERD in our Capstone 1 paper. These additions are
things specific features need in order to actually function, each one is
commented in the file itself:

| Addition | Needed for |
|---|---|
| `user.role` | Checking admin access on protected API routes |
| `quizresult.total` | The dashboard average score, `score` alone can't tell 8/10 from 8/20 |
| `awarenessassessment.weak_areas` / `.by_topic` / `.total` | FR-15 recommended modules, and the dashboard's weak-areas count |
| `module.slug` | Linking `modules/phishing.html` to its database row without matching on a title that admins can rename |
| `quizquestion` table | Storing quiz questions in the DB so the admin panel can edit them (FR-18) |
| `otpcode` table | Premium two-step login and password reset |
| `progress` unique key | Stops duplicate rows when a module is completed twice |

The `administrator` table from the base schema is left untouched so the ERD
still matches the paper. The backend checks `user.role` instead, because
admins need to be in the same login/session system as everyone else -
otherwise we'd maintain two separate password systems.

## FR-20: Premium two-factor email verification

Premium accounts require a second step at login: a 6-digit code emailed to
them, valid for 5 minutes, single-use, locked out after 5 wrong attempts.
Free accounts are unaffected, this is intentional, part of what
differentiates the Premium tier's account security.

**Without any setup**, this still works end to end, leave `SMTP_HOST`,
`SMTP_USER`, and `SMTP_PASS` blank in `.env`, and the code prints to the
server's own console instead of being emailed:
```
[email] SMTP not configured. OTP for someone@example.com: 482913
```
This is enough to fully test and demo the feature without a real mail
account. To actually send real emails, fill in `SMTP_HOST`, `SMTP_PORT`,
`SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` in `.env` with any real SMTP
provider's credentials (Gmail with an App Password, Resend, SendGrid, etc.).

## Connecting the frontend

This is a REST API, point `store.js` (or whichever file currently
simulates storage) at `http://localhost:3000/api/...` instead of
`localStorage`/`sessionStorage`. Every response shape is documented below.
Store the JWT `token` from register/login in memory or `sessionStorage`,
then send it as `Authorization: Bearer <token>` on every subsequent request.

## API Reference

### Auth (FR-09, FR-10, FR-20)
| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create an account. Body: `{first_name, email, password, subscription_type}` |
| POST | `/api/auth/login` | No | Log in. Body: `{email, password}`. Free accounts get a full session token immediately. **Premium accounts instead get `{requiresOtp: true, pendingToken}`**, see FR-20 below. |
| POST | `/api/auth/verify-otp` | No (uses pendingToken) | FR-20, step 2. Body: `{pendingToken, code}`. Returns the real session token once the 6-digit emailed code is verified. Codes expire in 5 minutes, are single-use, and lock out after 5 wrong attempts. |
| POST | `/api/auth/resend-otp` | No (uses pendingToken) | Re-sends a fresh code if the first one didn't arrive. |
| POST | `/api/auth/logout` | Yes | Stateless, client just discards the token |
| GET | `/api/auth/me` | Yes | Current account's profile + plan |
| PATCH | `/api/auth/me/subscription` | Yes | Change plan (Free/Premium), no payment processing |

### Modules (FR-01, FR-16, FR-17, FR-19)
| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| GET | `/api/modules` | Optional | List modules, Free-only for anonymous/Free users, all for Premium/admin |
| GET | `/api/modules/:slug` | Optional | One module, 403s on Premium content if not entitled |
| POST | `/api/modules` | Admin | Create a module (auto-creates its quiz) |
| PUT | `/api/modules/:id` | Admin | Edit a module, including toggling Free/Premium |
| DELETE | `/api/modules/:id` | Admin | Delete a module |

### Quizzes (FR-04, FR-13, FR-14, FR-18)
| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| GET | `/api/quizzes/by-module/:slug` | Optional | Quiz questions, answer key stripped out |
| POST | `/api/quizzes/:quizId/submit` | Yes | Submit answers, scored server-side, updates progress |
| POST | `/api/quizzes/:quizId/questions` | Admin | Add a question |
| PUT | `/api/quizzes/questions/:id` | Admin | Edit a question |
| DELETE | `/api/quizzes/questions/:id` | Admin | Delete a question |

### Dashboard (FR-12, FR-15)
| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| GET | `/api/dashboard` | Yes | Progress + quiz history + latest assessment, in one call |
| GET | `/api/dashboard/recommendations` | Yes | Recommended modules based on weak areas or unstarted modules |

### Assessment (FR-11)
| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| GET | `/api/assessment/questions` | No | The 10 questions, no answer key |
| POST | `/api/assessment/submit` | Yes | Submit answers, scored server-side, saved to the account |

## Administrator, a note for the ERD diagram

There's no separate `administrators` table. `users.role = 'admin'` is the
same pattern used in the Supabase version we evaluated earlier: one login
system, not two. If your ERD needs Administrator as its own labeled box for
the defense, that's fine visually, it maps to this same `users` table,
filtered by role.

## What was actually tested (not just written)

Every endpoint above was run against a real MariaDB instance during
development: registration, login, JWT verification, admin-only enforcement
(a non-admin genuinely gets rejected with 403), Premium content gating
(tested for a Free user, an anonymous visitor, and confirmed both correctly
blocked from Premium content while Free content stayed accessible to both),
quiz submission with server-side scoring, and the recommendation engine
correctly matching a failed assessment topic to the right module.

**FR-20 (OTP) was tested through the real UI, not just curl:** registered a
Premium account, logged in, confirmed the OTP form appears, confirmed a
wrong code is rejected, confirmed the correct code (read from the server's
own console) succeeds and lands on the dashboard, confirmed the same code
can't be reused, and confirmed Free accounts skip the OTP step entirely.

A real bug was caught and fixed during this testing: `verify-otp` originally
picked the "latest" OTP code using `ORDER BY created_at DESC`, but MySQL's
default `TIMESTAMP` only has 1-second resolution, if two codes were issued
within the same second (which happened naturally while testing an edge case
below), the wrong one could be selected non-deterministically. Fixed by
ordering on `otp_id DESC` instead, which is guaranteed monotonic.

A second edge case was caught: if an admin account is also on the Premium
plan, `admin.html`'s login would have crashed (reading `.role` off an OTP
response that has no `user` field yet). Fixed with a clear message directing
that account to log in via the regular page first, the session then
carries over to the admin panel automatically, confirmed working.

## What's not built yet

- File upload for module videos (FR-17's video part), `multer` is
  installed as a dependency for this, but the actual upload route isn't
  wired up yet.
- Rate limiting / brute-force protection on login.
- Password reset flow.
- Admin's "Quiz Questions" and "Users & subscriptions" tabs in `admin.html`
  still operate on local, in-memory demo data, only the "Modules" tab is
  wired to the real API. Wiring the other two needs a `GET /api/admin/users`
  endpoint (not yet built) and per-quiz question CRUD hooked to the real
  `quiz_id` for each module (the API for this already exists at
  `/api/quizzes/:quizId/questions`, it just isn't called from that tab yet).

## Real behavior differences from demo mode (worth knowing before your defense)

- **New account default plan**: in demo mode, every new registration was
  automatically Premium (there was no real subscription concept to gate
  against). With the real backend, new accounts default to **Free**, matching
  FR-09/FR-10's actual intent, Premium is opt-in via the upgrade flow. This
  was confirmed by testing: a fresh registration lands as Free, and that
  account is then correctly blocked from Premium module pages until upgraded.
- **Session persistence**: the JWT is stored in `sessionStorage` (not
  `localStorage`), intentionally, so "signs out when the tab closes" still
  holds true, matching language used elsewhere in this codebase's UI copy
  about the platform's session handling.
