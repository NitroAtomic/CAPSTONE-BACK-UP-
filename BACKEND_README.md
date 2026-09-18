# Backend added to this repository

**Added by:** IamAtomic
**Scope:** backend authentication and database (Week 4 task)

The `backend-node/` folder holds the Node.js + Express + MySQL API. It was
developed and tested separately and is being added here now. Nothing in the
existing frontend was changed.

---

## What is in `backend-node/`

Everything from the Week 4 authentication task, working and tested against
Jyan's database schema:

- Account creation, login, logout
- Session handling with JWT
- Password hashing with bcrypt
- Role and access checking (user vs admin, Free vs Premium)
- Password reset by emailed code
- Two-step verification for Premium accounts
- Subscription and plan management (FR-10, plan state only)
- Premium content gated server-side, not just hidden in the interface

`sql/` contains the three database files. `01-jyan-base-schema.sql` is Jyan's
schema, unmodified. `02-backend-additions.sql` adds the columns and tables that
specific features need, kept separate so the original stays reviewable.

See `BACKEND_DEFENSE_GUIDE.md` for the full API reference, every MySQL
Workbench command, and the reasoning behind each design decision.

---

## Running it

```
cd backend-node
npm install
npm start
```

Copy `.env.example` to `.env` first and fill in the database password and a
`JWT_SECRET`. Check `http://localhost:3000/api/health`, a healthy response is
`{"status":"ok"}`.

The database needs to exist before the API can start properly. In MySQL
Workbench, run the three files in `backend-node/sql/` in order, then:

```sql
CREATE USER 'seaware'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON awareness_platform.* TO 'seaware'@'localhost';
FLUSH PRIVILEGES;
```

---

## One thing the team needs to decide

The frontend in this repository is now built with **Vue** (see
`javascript/framework/vue/` and the root `package.json`). Those page components
render the interface but **do not call the API** yet, so login, registration,
the dashboard, and payment have no backend behind them.

The API is ready and framework-agnostic, so connecting it is a matter of
calling these endpoints from the Vue pages:

| Page | Endpoint |
|---|---|
| Login | `POST /api/auth/login` |
| Create account | `POST /api/auth/register` |
| Dashboard | `GET /api/dashboard` |
| Payment | `PATCH /api/auth/me/subscription` |
| Modules | `GET /api/modules` |

The quiz side is further along than the rest: the Vue build now has real
question banks in `javascript/framework/vue/data/` with ten questions per
module. Those still score in the browser, so hooking them to
`POST /api/quizzes/record-attempt` is what makes results appear on a user's
dashboard and persist between sessions.

Worth flagging: a working plain-JavaScript version of this frontend already
exists, with all of the above wired up and tested end to end. If the group is
committed to Vue, that wiring needs redoing as Vue components, which is real
work rather than a copy across. If the deadline is tight, the plain version is
available and functional today. Either way the decision is the group's, not
something the backend forces.

Either way the backend does not change. It serves whichever frontend the group
settles on.
