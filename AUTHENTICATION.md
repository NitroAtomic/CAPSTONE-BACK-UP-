# Backend Authentication System

**Owner:** Juan Paolo Dente
**Stack:** Node.js + Express + MySQL (matches what Jyan set up)

Covers the full scope from the Week 4 task list: account creation, login,
logout, session handling, user authentication, and role/access checking.

---

## Running it

**1. Start the backend** (separate repo/folder: `backend-node`)

```
cd backend-node
npm install
npm start
```
Runs on `http://localhost:3000`.

**2. Set up the database** (coordinate with Jyan first, see "Database" below)

```
mysql -u root < backend-node/sql/schema.sql
mysql -u root < backend-node/sql/seed.sql
```

**3. Point the frontend at it**

`javascript/backend-config.js`, one line:
```js
window.SE_API_BASE = "http://localhost:3000";
```
Change this to the live URL once the backend is deployed. Nothing else
needs to change.

**4. Open the frontend** with any static server (VS Code Live Server works).
Opening the HTML directly with `file://` will not work, the browser blocks
API calls from `file://` origins.

---

## What's wired up

| Page | What it does now |
|---|---|
| `create-account.html` | Real account creation. Validates all 5 password rules the UI promises, then creates the account and signs you in. |
| `login.html` | Real login. Premium accounts get a second step (emailed 6-digit code) before a session is issued. |
| `forgot-password.html` | Full two-step password reset: request a code, then set a new password. |
| `dashboard.html` | Requires login. Shows the real user's name, completed modules, average quiz score, and weak-area count from the database. |
| `payment.html` | Simulated checkout. Upgrades the account to Premium without processing any payment, and actively rejects real card numbers. See below. |
| Every page with a navbar | Shows "Log in" when signed out; shows the user's name + "Log out" when signed in. Hides "Go Premium" for accounts that already have it. |

---

## The payment page is a simulation

FR-10 covers subscription and plan state only, and the paper's Scope and
Limitations section excludes *"online payment gateway integration, automatic
billing, or financial transaction processing"*. So `payment.html` records the
plan change on the account and takes no payment. No card data is transmitted,
validated against a processor, or stored anywhere.

**Real card numbers are actively refused, not just discouraged.** The page
carries a prominent "Simulation only" banner, and the form rejects any entry
that passes the Luhn checksum, which is the algorithm genuine card numbers
satisfy. Only the documented demo number is accepted:

- Card: `4242 4242 4242 4242`
- Expiry: any future date
- CVV: any three digits

This matters beyond tidiness. During UAT a participant could type a real card
out of habit, and a platform that spends six modules teaching people to
distrust convincing payment screens should not ship one of its own without
saying so.

## For the rest of the team

To protect any page you're building, add this one line at the top of its
script, that's the whole access-control story:

```js
var user = SEAuth.requireLogin("login.html");
if (!user) return;          // not signed in: already redirected
```

Other variants:
```js
SEAuth.requireAdmin("index.html");              // admin only
SEAuth.requirePremium("premium-subscription.html"); // premium only
```

Reading the current user anywhere:
```js
SEAuth.getUser()        // { first_name, email, subscription_type, role, ... } or null
SEAuth.isSignedIn()     // true / false
SEAuth.isPremium()      // true / false
SEAuth.isAdmin()        // true / false
```

Include these two scripts before your own on any page that needs auth:
```html
<script src="javascript/backend-config.js"></script>
<script src="javascript/auth.js"></script>
```

---

## Database

`backend-node/sql/schema.sql` is what the backend expects. Jyan, worth
comparing against yours before we merge, so there's one source of truth.
Tables: `users`, `modules`, `quizzes`, `quiz_questions`, `quiz_results`,
`assessments`, `progress`, `otp_codes`.

Two notes on the schema:
- **No separate `administrators` table.** An admin is a row in `users` with
  `role = 'admin'`. A second parallel login system would be more code and
  more places a password could leak. To make someone an admin:
  `UPDATE users SET role='admin' WHERE email='...';`, there is deliberately
  no self-service way to do this.
- **`otp_codes`** is a support table (like `quiz_questions` supports
  `quizzes`), not a core ERD entity. It backs both the Premium login code
  and the password reset code, kept apart by a `purpose` column.

---

## Email (verification + password reset codes)

**No setup needed to test.** Leave the `SMTP_*` fields blank in `.env` and
codes print to the backend's own console instead of being emailed:

```
[email] SMTP not configured. PASSWORD RESET for someone@email.com: 482913
```

That's enough to demo and test the whole flow. To send real emails, fill in
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` in `.env`
using any SMTP provider (Gmail app password, Resend, SendGrid, etc.).

---

## Security notes (useful for the paper / defense)

- Passwords are hashed with **bcrypt**, never stored as plain text.
- Sessions use **JWT**, kept in `sessionStorage` so they clear when the tab
  closes, deliberate, since remote workers may use shared machines.
- **Premium content is gated server-side**, not just hidden in the UI. A
  Free user calling the API directly still gets a 403.
- **Admin routes check the role server-side** for the same reason.
- Reset codes and login codes are **single-use, expire in 5 minutes**, and
  lock out after 5 wrong attempts.
- `forgot-password` returns **the same response whether or not the email
  exists**, otherwise it could be used to discover which emails have
  accounts.

---

## Tested

Every flow below was run end to end against a real MySQL database and a
real browser, not just written:

- Account creation → lands on dashboard with the real name from the DB
- Login → session created, nav updates
- Logout → session cleared, nav reverts, protected pages bounce to login
- Visiting `dashboard.html` while signed out → redirected to `login.html`
- Password reset → old password stops working, new one works, code can't
  be reused
- Premium login → OTP step appears, wrong code rejected, correct code works
- All 27 pages in the repo load with zero JavaScript errors

---

## Not built yet

- Module/quiz progress writing from the free module pages (waiting on
  Joshua's module JavaScript, the API endpoints are ready)
- Payment processing on `payment.html` (out of scope per FR-10, which
  covers plan state only, not billing)
- Admin panel UI (backend routes exist and are tested)
