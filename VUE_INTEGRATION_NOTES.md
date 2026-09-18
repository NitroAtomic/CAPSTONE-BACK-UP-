# Vue pages connected to the backend

**By:** IamAtomic

The placeholder pages now call the API in `backend-node/`. Nothing in the
homepage, modules, or quizzes was touched.

## What was built

| Page | What it does now |
|---|---|
| `Login.vue` | Real login. Premium accounts get the two-step email code before a session is issued. |
| `CreateAccount.vue` | Real registration, enforcing the five password rules the page advertises. Arriving from the premium flow continues to payment rather than the dashboard. |
| `Dashboard.vue` | Requires an account. Shows the real name, modules completed, average quiz score, weak areas, quiz history and recommendations from the database. |
| `PremiumSubscription.vue` | Monthly / Yearly toggle (₱149 / ₱1,199). The choice is remembered and carried to the payment page. |
| `Payment.vue` | Simulated checkout, see below. |
| `ForgotPassword.vue` | Two-step reset: request a code, then set a new password. |
| `SiteHeader.vue` | Shows the user's name and a Log out button when signed in, and hides Go Premium for accounts that already have it. |

New shared files: `javascript/framework/vue/services/auth.js` (all API calls in
one place) and `css/framework/tailwind/pages/auth.css` (imported from
`main.css`, following the pattern documented at the top of that file).

## Running it

Two terminals.

```
cd backend-node
npm install
npm start          # http://localhost:3000
```

```
npm install
npm run dev        # http://localhost:5173
```

`.env` needs creating in `backend-node/` first: copy `.env.example`, fill in
the database password and a `JWT_SECRET`. The three SQL files in
`backend-node/sql/` set up the database and are run in order.

## Something worth fixing as a group

The old static pages are still in the repository root: `login.html`,
`create-account.html`, `dashboard.html`, `payment.html`,
`premium-subscription.html`, `forgot-password.html`, `about.html`,
`index.html`.

Vite serves a matching file before it reaches the Vue router, so opening
`localhost:5173/create-account` loads the **old static page**, not the Vue
component. Navigating inside the app works correctly; only typing the URL
directly hits the stale file.

Deleting them makes the routes behave consistently, but they are Joshua's
files and some may still be referenced, so that is a call for the group rather
than something to remove unilaterally.

## Payment is a simulation, deliberately

The paper's Scope and Limitations excludes *"online payment gateway
integration, automatic billing, or financial transaction processing"*, and
FR-10 covers plan state only. The page records the plan change and takes no
payment.

It carries a "Simulation only" banner and **refuses real card numbers**:
anything passing the Luhn checksum, which genuine card numbers satisfy, is
rejected. Only `4242 4242 4242 4242` is accepted. Labelling alone is not
enough, since during testing someone could type a real card out of habit, and a
platform that teaches people to distrust convincing payment screens should not
ship one that quietly accepts card details.

## Tested end to end

Register through the Vue form, dashboard shows the real name from the database,
log out, log back in, plan toggle carries Yearly pricing to the payment page,
a Luhn-valid card is rejected, the demo card upgrades the account, and the
database shows `subscription_type = 'Premium'`. Build passes with no errors.

## A CSS clash worth knowing about

The first version of these pages used class names like `.premium-card` and
`.premium-heading`, which already existed in `css/framework/tailwind/pages/home.css`
for the homepage premium section. Because both stylesheets load together, the
homepage rules won and turned the subscription card into a flex row with a
dashed border, so the whole page rendered on top of itself.

The classes are now namespaced per page so this cannot happen again:

| Page | Prefix |
|---|---|
| Subscription | `subscribe-` |
| Payment | `checkout-` |
| Dashboard | `dash-` |
| Shared form parts | `auth-` |

Worth keeping in mind when adding new styles: the old static stylesheets
(`css/home.css`, `css/payment.css`, `css/dashboard.css`,
`css/premium-subscription.css`) still define many of the obvious names.

## The chatbot is still a placeholder

`javascript/framework/vue/layout/ChatbotWidget.js` replies with the same canned
line to every message, and there is no chat route in `backend-node/`. Per the
task split this is Shane's area (AI prompt engineering and integration), and
connecting it needs either an n8n webhook URL or a Gemini API key.

If it helps, the backend side of it is a small route that proxies the message
to whichever provider is configured and returns a clear "not configured"
response when no key is set, so the widget degrades gracefully instead of
looking broken. Say the word and that can be added without touching the
prompt engineering itself.

---

## Everything is built now

The placeholder pages are gone. What exists, and who can reach it:

| Page | Access |
|---|---|
| Home, About | anyone |
| Free modules and their quizzes | anyone, no account needed |
| Login, Create account, Forgot password | signed out |
| Dashboard | any signed in account |
| Payment | any signed in account |
| Awareness assessment | Premium only |
| Role-based modules | Premium only |
| Module management | admin only |

Each gate redirects rather than showing a broken page: a Free account opening
the assessment lands on the subscription page, a non-admin opening the module
manager lands on their dashboard. **The server enforces the same rules**, so
the redirect is a convenience and not the actual control.

### The awareness assessment

Fifteen questions across the six topics, including one "select all that apply".
Scoring produces a level, a per topic breakdown, and a list of weak areas,
which is what the dashboard's recommendations then use. A topic counts as weak
below two thirds correct.

The result saves through `POST /api/assessment/submit`. If the save fails the
result still shows, with a note saying it was not recorded, rather than the
screen going blank.

### Role-based modules

Four modules written for freelance and contract work: client impersonation,
invoice and payment scams, fake recruiters, and client data handling. Content
lives in `data/premium-modules.json`, so editing it needs no component changes.

### Module management

Create, edit and delete modules against the real API. The slug field is
validated, since it is what links a module page to its database row. Deleting
asks first, because it takes the module's quiz and any saved progress with it.

To make an account an admin:

```sql
UPDATE user SET role = 'admin' WHERE email = 'your@email.com';
```

Log out and back in afterwards so the new role is carried in a fresh token.

### Styling

Deliberately plain: black borders, white background, no colour beyond the
red and green used for error and success messages. The visual design is a
separate pass, so nothing here should be treated as final.

### Tested

All 24 routes were loaded as a guest and as an admin with no console errors.
The assessment was completed end to end and confirmed in the database, and
creating a module through the admin panel was confirmed as a real row.

One thing worth knowing when testing: **a Premium account needs the emailed
code to log in**, and with no SMTP configured that code prints in the backend
terminal. Keep it visible or you will be stuck at the verification step.

---

## A caching bug worth remembering

The navbar kept offering "Go Premium" to accounts that had just upgraded, and
the homepage kept showing padlocks.

The cause was the same in both places:

```js
computed: {
  isPremium() {
    return auth.isPremium()   // reads sessionStorage
  }
}
```

Vue caches a computed and only re-evaluates when one of its **reactive**
dependencies changes. `sessionStorage` is not reactive, so this had nothing to
invalidate on: it returned false on first render and kept returning false
forever, no matter what changed underneath.

Both now derive from a reactive `user` property that is refreshed on every
route change:

```js
isPremium() {
  return this.user?.subscription_type === 'Premium' &&
         this.user?.subscription_status === 'active'
}
```

**Worth watching for** anywhere else that calls `auth.*` from inside a
computed. Methods are fine, since they run every time. It is computeds
specifically that need a reactive source.

## The assistant answers for real now

`POST /api/chat` proxies to n8n or Gemini when either is configured. Without
one it answers from a curated set of topics drawn from the platform's own
modules: the six attack types, passwords, multi-factor authentication, invoice
scams, recruitment scams, and home network security. Anything outside that gets
an honest reply listing what it does cover.

The reason for the fallback: a chat window replying "not connected yet" to
every question is worse than no chat window, and the prompt engineering for a
live provider is separate work. Setting `N8N_WEBHOOK_URL` or `GEMINI_API_KEY`
takes over automatically, with no frontend change.

## Dashboard charts

Assessment scores per topic and quiz scores over time, drawn as plain bars
rather than a charting library. One less dependency, and nothing to unpick when
the visual design pass happens.

Weak areas and recommendations now show readable names rather than raw slugs,
and the recommendation cards link to the module instead of being decorative.

---

## The assistant answers from our own content

The chat route now retrieves from the platform's modules before answering, so
replies teach our material rather than whatever the model happens to know.

### How it works

`npm run kb:build` in `backend-node` reads the six free module pages, the
role-based module content, and the explanations attached to every quiz and
assessment question, then writes `data/knowledge-base.json`. That file is
committed, so a fresh clone works with no setup.

On each question, `config/retrieval.js` ranks passages with BM25 and passes the
best four to the model as context, with instructions to answer only from them
and to say so plainly when they do not cover the question.

### Why not embeddings and a vector store

Embeddings would match on meaning rather than words, which is genuinely
better. They were not used here because:

- an in-memory vector store empties whenever the service restarts, which means
  re-running ingestion before every demo
- it adds an embedding API call per query, so more cost and latency
- it is another service to keep running

BM25 is a committed file with no moving parts. The tradeoff is real: a question
phrased in entirely different vocabulary to the source retrieves less well.
For a fixed body of teaching material with consistent terminology, that trade
is worth taking.

### Getting the retrieval right took two passes

The first version ranked "what should I do about a suspicious invoice" against
a passage on smishing. Two causes:

1. The free module pages were indexed as one block each, so every chunk shared
   a vague title, while role-based modules had descriptive headings like "Red
   flags". Module pages are now split on their own section headings.
2. Title terms were folded in with body terms, so in a hundred-word passage
   the title barely registered. Titles are now scored separately and weighted.

After both, invoice questions reach the invoice module, recruiter questions
reach the recruitment module, and home network questions reach the right
section of module 6.

### With and without an AI key

| Configured | Behaviour |
|---|---|
| Nothing | Returns the best matching passage directly and names its source. Accurate and ours, if a little formal. |
| `GEMINI_API_KEY` | Gemini answers from the retrieved passages. |
| `N8N_WEBHOOK_URL` | The question goes to n8n untouched, since that workflow has its own prompt and knowledge base. |

Google AI Studio gives a free key with no credit card, limited to Flash models
at roughly 10 to 15 requests a minute. Note that free tier inputs may be used
to improve Google's models, so nothing sensitive should be typed into it.

**The Gemini path is written but untested here**, since I had no key to try it
with. The retrieval and the no-key fallback are both tested.

---

## Two bugs found by actually using the assistant

### The model name was out of date

`gemini-2.0-flash` has been retired. The API returned a 404 naming
`gemini-3.6-flash` as the replacement, the backend logged it, and the chat
carried on answering from the knowledge base. A user would never have noticed,
which is both the point of the fallback and the reason this took a terminal
check to spot.

**If answers stop sounding conversational, check the backend log for a 404.**
Google retires model names periodically and the error names the replacement.

### Replies were cut off mid-sentence

Gemini 3.x reasons before answering, and those thinking tokens count against
`maxOutputTokens`. At 400 the reasoning consumed the whole budget and replies
arrived as fragments like "I cannot help with that, as our learning modules".

Fixed by raising the budget to 2048 and setting `thinkingBudget: 0`, since no
reasoning is needed to summarise a passage that has already been retrieved. A
`MAX_TOKENS` finish reason now also falls back rather than showing half a
sentence.

## Typo tolerance, and the false positives it caused

"pishing" originally matched nothing, so the assistant claimed it had no
information on a topic the platform covers in depth.

Fuzzy matching fixed that and immediately created a worse problem: matching
against the whole vocabulary mapped unrelated questions onto real passages.
"How do I bake bread" found "spread", then confidently answered about
recruitment scams.

Two constraints fixed it:

1. **Only topic vocabulary is a correction target.** Words from passage titles
   are the subjects this platform teaches, so an off topic word has nothing to
   land on.
2. **The first letter must match.** Typos rarely change it; different words
   frequently do. This is what stopped "bake" correcting to "fake".

There is also a score floor on the no-provider path, because that one hands a
passage straight to the user with nothing in between to judge the fit. With a
provider configured a weak match is harmless, since the model is instructed to
say when the passages do not cover the question.

Current behaviour: pishing, smshing, vishng, quishng, pretexing, invoce and
recruter all reach the right module. Pizza recipes, football scores, baking
bread and laptop recommendations all correctly get "I do not cover that".

---

## Recommendations: a bug that hid one module entirely

The assessment records weakness by topic key, and recommendations matched
those against `module.category`. The two drifted apart: a user weak in
`quishing` was matched against a module whose category was `phishing`, so
**the Quishing module could never be recommended**, no matter how badly
someone scored on it. The other five topics matched by coincidence of naming.

Nothing failed loudly. The endpoint returned an empty list, the dashboard
showed no recommendations, and it looked like the user simply had no weak
areas.

Two changes:

1. The Quishing module's category now matches its topic key.
2. Matching checks **slug as well as category**, so a future rename degrades
   rather than silently returning nothing.

Recommendations are also now ordered weakest first, using the per topic
tallies, so the module someone struggled with most appears at the top instead
of whichever row the database happened to return. Up to three, previously two.

Retaking the assessment already updated the recommendations, since the query
reads the most recent row.

