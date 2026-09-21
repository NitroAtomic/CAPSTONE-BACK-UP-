# Backend API (Node.js + Express + MySQL)

**Web-Based Social Engineering Awareness Platform for Remote Workers**
Group 4 | Capstone 2

Backend and integration: IamAtomic
Database schema: Jyan Estanislao (see `sql/01-jyan-base-schema.sql`)

Runs against the `awareness_platform` database. Every endpoint was tested
against a real MySQL instance and through the actual frontend before being
committed, not written and assumed correct.

## Setup

The database is split into four files so Jyan's original schema stays
intact and reviewable, separate from what the backend needed added.

1. Install MySQL 8 (or MariaDB — see the collation note below if you use MariaDB).
2. Run the four SQL files **in order**:
   ```
   mysql -u root < sql/01-jyan-base-schema.sql          # Jyan's schema, unmodified
   mysql -u root < sql/02-backend-additions.sql         # columns/tables the API needs
   mysql -u root < sql/03-seed.sql                      # the 10 modules + their quizzes
   mysql -u root < sql/04-seed-quiz-questions.sql       # quiz-question bank for the admin panel
   ```
   > **MariaDB note:** `01-jyan-base-schema.sql` and `02-backend-additions.sql` use
   > `utf8mb4_0900_ai_ci`, a MySQL 8-only collation. On real MySQL 8 (what Aiven runs
   > in production) this is fine as-is. If you're testing locally against MariaDB
   > instead, swap that collation for `utf8mb4_general_ci` in both files first, or the
   > `CREATE TABLE` statements will fail with `Unknown collation`.
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
| `module.slug` | Linking a module page to its database row without matching on a title that admins can rename |
| `quizquestion` table | Storing quiz questions in the DB so the admin panel can edit them (FR-18) |
| `otpcode` table | Premium two-step login and password reset |
| `progress` unique key | Stops duplicate rows when a module is completed twice |

The `administrator` table from the base schema is left untouched so the ERD
still matches the paper. The backend checks `user.role` instead, because
admins need to be in the same login/session system as everyone else -
otherwise we'd maintain two separate password systems.

## What `04-seed-quiz-questions.sql` adds, and its one real limitation

The six free modules' actual quizzes (20 questions each, 120 total) are
transcribed from the official *Capstone 2 - Content Module Documentation*
and live in `javascript/framework/vue/data/module-1.json` through
`module-6.json`. Those files are what students actually take — the quiz is
scored client-side and is bundled into the frontend build. `04-seed-quiz-questions.sql`
does **not** feed that quiz at all.

What it does feed is the admin "Quiz questions" panel (FR-18) and the
server-side `POST /api/quizzes/:quizId/submit` scoring path, both of which
read the `quizquestion` table. Before this file, that table — and that whole
admin screen — was seeded to zero rows, so a fresh database had nothing to
show there.

**The limitation:** `quizquestion.correct_option_index` is a single integer,
and the admin's question form hardcodes exactly 4 options. The real
120-question bank also has True/False questions (2 options) and
scenario-based questions with more than one correct answer, and neither of
those shapes fits this table or that form. Rather than truncate them to a
wrong shape or silently drop the answer key, `04-seed-quiz-questions.sql`
only seeds the 66 questions across the six modules that are already
plain 4-option, single-answer — the remaining 54 are skipped, and the file's
header comments spell out the exact count per module. If the team wants full
120-question parity in the admin panel later, that needs a schema change
first (`correct_option_index` → a JSON list of correct indices, plus an
admin form that supports 2-6 options per question). Flagging this now so
it's a documented decision for the defense, not a surprise found live.

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

The same OTP mechanism (`otpcode` table, `purpose = 'password_reset'`) backs
the password reset flow below.

## Connecting the frontend

This is a REST API. `javascript/framework/vue/services/auth.js` calls it at
`/api/...` (same origin in production, `http://localhost:3000` in dev).
Store the JWT `token` from register/login in `sessionStorage` (not
`localStorage` — intentional, see below), then send it as
`Authorization: Bearer <token>` on every subsequent request.

## API Reference

### Auth (FR-09, FR-10, FR-20)
| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create an account. Body: `{first_name, email, password, subscription_type}` |
| POST | `/api/auth/login` | No | Log in. Body: `{email, password}`. Free accounts get a full session token immediately. **Premium accounts instead get `{requiresOtp: true, pendingToken}`**, see FR-20 above. |
| POST | `/api/auth/verify-otp` | No (uses pendingToken) | FR-20, step 2. Body: `{pendingToken, code}`. Returns the real session token once the 6-digit emailed code is verified. Codes expire in 5 minutes, are single-use, and lock out after 5 wrong attempts. |
| POST | `/api/auth/resend-otp` | No (uses pendingToken) | Re-sends a fresh code if the first one didn't arrive. |
| POST | `/api/auth/forgot-password` | No | Request a password reset code by email. Always returns the same generic message whether or not the account exists, so this can't be used to enumerate registered emails. |
| POST | `/api/auth/reset-password` | No (uses the emailed code) | Verifies the reset code and sets a new password. |
| POST | `/api/auth/logout` | Yes | Stateless, client just discards the token |
| GET | `/api/auth/me` | Yes | Current account's profile + plan |
| PATCH | `/api/auth/me/subscription` | Yes | Change plan (Free/Premium), no payment processing |

Login, register, the two password-reset endpoints, and the OTP endpoints all
sit behind rate limiting (`middleware/rateLimit.js`) so they can't be brute-forced.

### Modules (FR-01, FR-16, FR-17, FR-19)
| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| GET | `/api/modules` | Optional | List modules, Free-only for anonymous/Free users, all for Premium/admin |
| GET | `/api/modules/premium-list` | No | Public teaser list (title/summary/category) of every Premium module, so the value of upgrading is visible before signing in |
| GET | `/api/modules/:slug` | Optional | One module, 403s on Premium content if not entitled |
| POST | `/api/modules` | Admin | Create a module (auto-creates its quiz). Accepts `video_url` — see the note below. |
| PUT | `/api/modules/:id` | Admin | Edit a module, including `video_url` and toggling Free/Premium |
| DELETE | `/api/modules/:id` | Admin | Delete a module |

**Module video (FR-17):** implemented as a plain `video_url` field, not a file
upload. `multer` is still listed in `package.json` from when a file-upload
route was the original plan, but it's unused — a URL field is simpler, needs
no storage/CDN, and is what every module page's `<ModuleVideo>` embed
actually reads. Left the dependency in rather than touching `package-lock.json`
by hand; it can be removed with `npm uninstall multer` whenever someone runs
a real `npm install` pass.

### Quizzes (FR-04, FR-13, FR-14, FR-18)
| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| GET | `/api/quizzes/by-module/:slug` | Optional | Quiz questions from `quizquestion`, answer key stripped out (see the DB-vs-static-JSON note above — the six free modules' real quizzes don't use this) |
| POST | `/api/quizzes/record-attempt` | Yes | Records an already-scored attempt. This is what the live site's module quizzes actually call — they're scored client-side from `module-N.json`, and this endpoint just persists the result and flips module progress on a pass. |
| POST | `/api/quizzes/:quizId/submit` | Yes | Submit answer indices, scored server-side against `quizquestion`. Only meaningful for a quiz whose `quizquestion` rows are seeded (see `04-seed-quiz-questions.sql`'s 66/120 coverage). |
| GET | `/api/quizzes/:quizId/questions` | Admin | Full question bank including the answer key, for the admin edit screen |
| POST | `/api/quizzes/:quizId/questions` | Admin | Add a question |
| PUT | `/api/quizzes/questions/:id` | Admin | Edit a question |
| DELETE | `/api/quizzes/questions/:id` | Admin | Delete a question |

A quiz attempt only marks its module "completed" at a 70% pass mark
(`PASSING_SCORE_RATIO` in `quizzes.js`, kept in sync with the same threshold
in the frontend's `QuizQuestion.js`). A failed attempt is still recorded for
quiz history, it just doesn't flip progress.

### Dashboard (FR-12, FR-15)
| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| GET | `/api/dashboard` | Yes | Progress + quiz history + latest assessment, in one call |
| GET | `/api/dashboard/recommendations` | Yes | Recommended modules based on weak areas or unstarted modules |

The dashboard's quiz history also shows a Pass/Fail badge per attempt,
computed the same way (`score / total >= 0.7`).

### Assessment (FR-11)
| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| GET | `/api/assessment/questions` | No | The 10 questions, no answer key |
| POST | `/api/assessment/submit` | Yes | Submit answers, scored server-side, saved to the account. Returns `201 Created`. |

### Chat assistant
| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| POST | `/api/chat` | Optional | Sends a message to the assistant (n8n/Gemini-backed, falls back to a local FAQ match). Any text matching a password-like pattern in the user's message is redacted before it's forwarded anywhere, so a pasted password never reaches a third-party AI provider. |

## Administrator, a note for the ERD diagram

There's no separate `administrators` table. `users.role = 'admin'` is the
same pattern used in the Supabase version we evaluated earlier: one login
system, not two. If your ERD needs Administrator as its own labeled box for
the defense, that's fine visually, it maps to this same `users` table,
filtered by role.

The admin panel itself currently covers **Modules** (create/edit/delete,
including video URL and Free/Premium toggling) and **Quiz questions**
(add/edit/delete per module, per the limitation above). There's no
"Users & subscriptions" admin screen in the current Vue app — that existed
only in the pre-Vue static `admin.html` demo and wasn't carried over. If the
team wants it, it needs a new `GET /api/admin/users` endpoint (not built)
plus a new Admin.vue section; it's not currently planned unless someone asks
for it.

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
plan, the admin login would have crashed (reading `.role` off an OTP
response that has no `user` field yet). Fixed with a clear message directing
that account to log in via the regular page first, the session then
carries over to the admin panel automatically, confirmed working.

`04-seed-quiz-questions.sql` was run end-to-end against a real database
(schema → additions → seed → quiz questions, in order) before being
committed: confirmed all 66 rows insert, `quiz.number_of_questions` updates
to match each module's actual seeded count, every `correct_option_index`
points at a real option, and the JSON in `options` parses cleanly.

## What's not built yet

- Admin's "Users & subscriptions" screen (see the ERD note above) — never
  existed in the current Vue admin panel, only in the superseded pre-Vue demo.
- Full 120-question parity in the DB-backed quiz-question admin editor (see
  the `04-seed-quiz-questions.sql` section above for the exact gap and what
  a fix would need).

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
