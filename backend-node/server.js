// server.js
// Backend and integration: IamAtomic
//
// Web-Based Social Engineering Awareness Platform for Remote Workers
// Group 4 | Capstone 2
//
// Node.js + Express + MySQL. Serves the API and, in production, the built
// Vue frontend from the same origin so there is only one thing to deploy.

const path = require('path');
const fs = require('fs');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const config = require('./config/env');
const pool = require('./config/db');
const { authLimiter, otpLimiter, generalLimiter } = require('./middleware/rateLimit');

const authRoutes = require('./routes/auth');
const moduleRoutes = require('./routes/modules');
const quizRoutes = require('./routes/quizzes');
const dashboardRoutes = require('./routes/dashboard');
const assessmentRoutes = require('./routes/assessments');
const chatRoutes = require('./routes/chat');

const app = express();

// Behind a host like Render or Railway the real client IP arrives in a
// forwarded header. Rate limiting needs this or it sees every request as
// coming from the proxy.
if (config.isProduction) app.set('trust proxy', 1);

// Standard protective headers: clickjacking, MIME sniffing, referrer leakage.
// The default content security policy is disabled because the frontend loads
// fonts and the chatbot widget from elsewhere; the rest of helmet still applies.
app.use(helmet({ contentSecurityPolicy: false }));

// No reason to advertise the framework and version to anyone scanning.
app.disable('x-powered-by');

app.use(compression());

// Previously this was app.use(cors()) with no options, which let any website
// on the internet call this API with a logged in user's browser. Now only the
// origins named in CORS_ORIGINS are allowed, and in development the local
// Vite server is permitted so the two ports can talk to each other.
const allowedOrigins = config.isProduction
  ? config.corsOrigins
  : [...config.corsOrigins, 'http://localhost:5173', 'http://127.0.0.1:5173',
     'http://localhost:5500', 'http://127.0.0.1:5500'];

app.use(cors({
  origin(origin, callback) {
    // Requests with no Origin header are things like curl or a health check,
    // not a browser acting on behalf of a signed in user.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS.'));
  },
  credentials: true,
}));

// A size cap so a single huge request body cannot exhaust memory.
app.use(express.json({ limit: '100kb' }));

app.use('/api', generalLimiter);

// Reports whether the database is actually reachable, not just whether the
// process is alive. A host's health check should fail if MySQL is down.
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    // Logged, because a health check that only says "unreachable" leaves you
    // guessing between a wrong password, a firewall, and a TLS problem. The
    // reason stays in the server log rather than the response, since the
    // response is public.
    console.error('[health] database unreachable:', err.code || '', err.message);
    res.status(503).json({ status: 'degraded', database: 'unreachable' });
  }
});

// The stricter limits sit in front of the endpoints worth guessing at.
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth/verify-otp', otpLimiter);
app.use('/api/auth/resend-otp', otpLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/chat', chatRoutes);

// In production the Vue app is built to ../dist and served from here, so the
// site and the API share an origin and there is no CORS hop at all.
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // Vue Router owns the URLs, so anything that is not an API call or a real
  // file falls through to index.html and the router decides what to render.
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  if (err && err.message === 'Origin not allowed by CORS.') {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }

  console.error(err);

  // Error details can name tables, columns, or file paths, so they stay in
  // the server log rather than going back to the browser.
  res.status(500).json({ error: 'Something went wrong.' });
});

app.listen(config.port, () => {
  console.log(`Group 4 API listening on port ${config.port}`);
  if (!config.isProduction) console.log('Running in development mode.');
});

module.exports = app;
