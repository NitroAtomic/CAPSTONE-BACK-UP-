# Backend and Database Documentation

**Web-Based Social Engineering Awareness Platform for Remote Workers**
Group 4 | MO-IT200D1 | Capstone 2

**Backend and integration:** IamAtomic
**Database schema:** Jyan Estanislao

This is a defence reference. It covers what was built, how to run it, every
command used in MySQL Workbench, and answers to the questions a panel is
most likely to ask.

---

## 1. What the backend does

| Requirement | Implementation |
|---|---|
| FR-09 | Account creation, login, logout |
| FR-10 | Subscription and plan management (plan state only, no payment processing) |
| FR-20 | Two-step email verification for Premium accounts |
|, | Password reset by emailed code |
|, | Role and access checking (user vs admin, Free vs Premium) |

---

## 2. Technology stack, and why

| Choice | Reason |
|---|---|
| **Node.js + Express** | Matches the stack documented in the paper. Express keeps routing and middleware explicit, which suits a project where access control has to be easy to point at and explain. |
| **MySQL** | Relational data with clear foreign keys: a user has many quiz results, a module has one quiz. Also what Jyan set up. |
| **bcrypt** | Passwords are hashed, never stored readable. Deliberately slow by design, which is what makes offline brute-force impractical. |
| **JWT** | Stateless sessions. The server does not keep a session table; the signed token carries the user ID and role. |
| **nodemailer** | Sends OTP and password-reset codes. Falls back to printing codes to the server console when no SMTP is configured, so the flow is fully testable without a mail account. |

---

## 3. Database

### Schema files, run in order

| File | Purpose |
|---|---|
| `01-jyan-base-schema.sql` | Jyan's schema, **unmodified**. The seven ERD entities: `user`, `module`, `quiz`, `quizresult`, `awarenessassessment`, `progress`, `administrator`. |
| `02-backend-additions.sql` | Columns and tables specific features need. Kept separate so Jyan's original work stays reviewable. |
| `03-seed.sql` | The ten modules (six free, four premium) and their quiz rows. |

### What `02-backend-additions.sql` adds, and why

Each of these exists because a feature does not work without it. Be ready to
justify them individually.

| Addition | Needed for |
|---|---|
| `user.role` | Checking admin access on protected routes |
| `quizresult.total` | The dashboard average. `score` alone cannot distinguish 8/10 from 8/20 |
| `awarenessassessment.weak_areas`, `.by_topic`, `.total` | FR-15 recommended modules, and the dashboard's weak-areas count |
| `module.slug` | Linking `modules/phishing.html` to its row without matching on a title an admin can rename |
| `quizquestion` table | Storing quiz questions in the database so the admin panel can edit them |
| `otpcode` table | Premium two-step login (FR-20) and password reset |
| `progress` unique key | Prevents duplicate rows when a module is completed twice |

### On the `administrator` table

Jyan's schema includes a separate `administrator` entity, matching the ERD in
the paper, and **it was left in place unchanged**. The backend checks
`user.role = 'admin'` instead.

**If asked why:** an administrator still needs to log in, and login is already
handled for every account through `user`. A second table with its own password
column would mean maintaining two separate authentication systems, two places a
password could be mishandled, and two login paths to secure. One system with a
role flag is both less code and less risk. The ERD is unchanged; the
implementation resolves the same relationship differently.

---

## 4. Commands used in MySQL Workbench

### Setting up the database

Open each file with **File → Open SQL Script**, then run it with the
lightning bolt (⚡). Order matters: file 2 alters tables that file 1 creates,
and file 3 inserts into them.

```
01-jyan-base-schema.sql
02-backend-additions.sql
03-seed.sql
```

### Creating the application's database user

The backend does not connect as `root`. It uses a dedicated account whose
privileges are limited to this one database.

```sql
CREATE USER 'seaware'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON awareness_platform.* TO 'seaware'@'localhost';
FLUSH PRIVILEGES;
```

**If asked why not root:** if the application's credentials ever leaked, this
account can only reach `awareness_platform`. Root could reach every database on
the server.

### Verifying the setup

```sql
-- Confirm all tables exist (expect 9)
SHOW TABLES FROM awareness_platform;

-- Confirm the seed data loaded (expect 10 each)
SELECT COUNT(*) FROM awareness_platform.module;
SELECT COUNT(*) FROM awareness_platform.quiz;

-- Confirm the user table has every column the backend needs
DESCRIBE awareness_platform.user;
```

### Proving passwords are hashed

This is the single most useful query to run in front of a panel.

```sql
SELECT user_id, first_name, email, subscription_type, role, password_hash
FROM awareness_platform.user;
```

The `password_hash` column shows something like `$2b$10$Tzae4t4Qvql...`, not
the password that was typed. `$2b$` identifies bcrypt and `10` is the cost
factor.

### Promoting an account to administrator

```sql
UPDATE awareness_platform.user
SET role = 'admin'
WHERE email = 'your@email.com';
```

**If asked why this is manual:** there is deliberately no self-service way to
become an admin. A button or endpoint that grants admin rights would defeat the
purpose of having them. Promotion requires direct database access.

### Checking that a subscription actually changed

```sql
SELECT email, subscription_type, subscription_status
FROM awareness_platform.user
WHERE email = 'your@email.com';
```

### Useful during testing

```sql
-- Remove a test account to re-run a signup
DELETE FROM awareness_platform.user WHERE email = 'test@test.com';

-- Inspect OTP codes (they are hashed, same as passwords)
SELECT otp_id, user_id, purpose, expires_at, used, attempts
FROM awareness_platform.otpcode ORDER BY otp_id DESC;
```

---

## 5. Running the backend

```
cd backend-node
npm install
npm start
```

Expect `Group 4 API listening on port 3000`.

Then open `index.html` with **Live Server** in VS Code.

**Important:** opening the HTML by double-clicking will not work. A `file://`
page is blocked from calling the API, so every request fails. It must be served
over `http://`.

### Configuration

`.env` holds the database password and JWT secret. It is excluded from Git by
`.gitignore`; `.env.example` is the committed template with placeholder values.

**If asked why:** committing `.env` would publish the database password and the
JWT secret. Anyone with the JWT secret could forge a login token for any
account, including an administrator.

### Health check

```
http://localhost:3000/api/health
```

Returns `{"status":"ok"}` when the API is up and the database is reachable.

---

## 6. API endpoints

### Authentication

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` |, | Create an account |
| POST | `/api/auth/login` |, | Log in. Premium accounts receive `requiresOtp` instead of a token |
| POST | `/api/auth/verify-otp` | pending token | Submit the emailed code, receive the real session token |
| POST | `/api/auth/resend-otp` | pending token | Send a fresh code |
| POST | `/api/auth/logout` | yes | End the session |
| GET | `/api/auth/me` | yes | Current account and plan |
| PATCH | `/api/auth/me/subscription` | yes | Change plan (FR-10) |
| POST | `/api/auth/forgot-password` |, | Request a reset code |
| POST | `/api/auth/reset-password` |, | Submit code and new password |

### Content and progress

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/modules` | optional | List modules. Premium ones are withheld unless entitled |
| GET | `/api/modules/:slug` | optional | One module, 403 if Premium and not entitled |
| POST/PUT/DELETE | `/api/modules` | **admin** | Module management |
| GET | `/api/quizzes/by-module/:slug` | optional | Quiz questions, answer key withheld |
| POST | `/api/quizzes/:quizId/submit` | yes | Submit answers, scored server-side |
| POST/PUT/DELETE | `/api/quizzes/.../questions` | **admin** | Question management |
| GET | `/api/dashboard` | yes | Progress, quiz history, latest assessment |
| GET | `/api/dashboard/recommendations` | yes | Modules based on weak areas |
| POST | `/api/assessment/submit` | yes | Save an assessment result |

---

## 7. Security decisions worth defending

**Passwords are bcrypt-hashed, never stored in readable form.** Demonstrable
with the `SELECT ... password_hash` query above. Even with full database
access, the original passwords cannot be read.

**Premium content is gated on the server, not just hidden in the interface.**
A Free account calling `/api/modules/client-impersonation` directly receives
`403 Forbidden`. Hiding a button only stops people who do not look.

**Admin routes check the role server-side** for the same reason. Reaching the
admin page in the browser is not the same as being allowed to change anything.

**Quiz answer keys are withheld during an attempt.** `GET /api/quizzes/by-module/:slug`
returns questions and options but not `correct_option_index`. Scoring happens
on the server, so the answers are not sitting in the page for anyone who opens
developer tools.

**Sessions use `sessionStorage`, not `localStorage`,** so they end when the tab
closes. Appropriate for remote workers who may be on a shared machine.

**OTP and reset codes are hashed, single-use, expire in five minutes, and lock
out after five wrong attempts.**

**`forgot-password` returns the same response whether or not the email exists.**
Otherwise it could be used to discover which addresses have accounts.

---

## 8. Scope limits, stated plainly

**Payment processing is simulated, deliberately.** The paper's Scope and
Limitations section excludes *"online payment gateway integration, automatic
billing, or financial transaction processing"*, and FR-10 covers plan state
only. `payment.html` records the plan change and takes no payment.

The page carries a "Simulation only" banner and **actively rejects real card
numbers**: anything passing the Luhn checksum, which is the algorithm genuine
card numbers satisfy, is refused. Only the documented demo card
`4242 4242 4242 4242` is accepted.

**If asked why bother rejecting real cards:** labelling a page as a demo is not
enough on its own. During user testing a participant could type a real card out
of habit. A platform that spends six modules teaching people to distrust
convincing payment screens should not ship one of its own that quietly accepts
card details.

**Billing period is display-only.** The account records `subscription_type =
'Premium'` whether Monthly or Yearly was chosen, because there is no billing
cycle to track without real payment processing.

### Not implemented

- **Rate limiting on login.** No lockout after repeated failures. Acceptable
  for a local academic deployment, not for public production.
- **Email verification at registration.** The address is not confirmed.
- **Quiz page logic.** The quiz pages are static mockups; the logic is separate
  frontend work. The backend endpoints for recording results exist and are
  tested.

---

## 9. Likely panel questions

**"How do you know passwords are secure?"**
Run the `SELECT ... password_hash` query. The stored value is a bcrypt hash
beginning `$2b$10$`, not the password. bcrypt is intentionally slow, which is
what makes large-scale offline guessing impractical.

**"Can a free user access premium content by editing the page?"**
No. The gate is on the server. Calling the API directly with a Free account's
token returns 403. The interface hiding a link is a convenience, not the
control.

**"What happens if someone steals the JWT token?"**
They could act as that user until it expires. That is inherent to token-based
sessions. Mitigations here: tokens live in `sessionStorage` and die with the
tab, and they expire on their own. Shorter expiry with refresh tokens would be
the next step in a production build.

**"Why is the payment fake?"**
Because the paper says it should be. Scope and Limitations excludes payment
processing, and FR-10 covers plan state only. We built the full checkout
experience and simulated the processing step, then went further and made
entering a real card impossible.

**"Why is there no separate administrator table when the ERD has one?"**
The ERD is unchanged and the table exists. The backend checks a role on the
user record instead, because administrators need to log in through the same
system as everyone else. Two parallel password systems would be more code and
more risk for no benefit.

**"What was the hardest part?"**
Turning the ERD into working access rules. Drawing that a user has many
progress records is one thing; writing the rule that a user sees only their own
rows while an admin sees all of them, and making sure it cannot be bypassed
from the browser, is another. It meant looking at every table and asking what
the worst thing a malicious user could attempt was, not just what a legitimate
user needs.
