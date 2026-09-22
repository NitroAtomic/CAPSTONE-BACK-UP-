// server.js
// IamAtomic — Group 4 Capstone 2, SE-AWARE backend
//
// Node + Express + MySQL. Isang server lang to, API tapos yung built Vue
// frontend, wala nang two deploys kailangan.

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

// Sa likod ng Render/Railway, yung totoong IP nasa header na "forwarded".
// Kailangan to para gumana ng tama yung rate limiter, kundi parang isang tao
// lang lahat ng request.
if (config.isProduction) app.set('trust proxy', 1);

// Standard security headers. CSP naka-off kasi may external fonts at chatbot
// widget na iba pinagkukunan, pero yung iba sa helmet gumagana pa rin.
//
// Referrer policy: "strict-origin-when-cross-origin", hindi yung default ng
// helmet na "no-referrer". Kailangan ng YouTube ng referrer para makilala kung
// sino nag-e-embed; kapag wala, Error 153 ("Video player configuration error")
// yung lumalabas sa lahat ng embedded videos natin. Ito rin naman yung default
// ng browsers at recommended ng YouTube, at domain lang natin ang pinapadala
// sa ibang sites, hindi yung buong page path.
app.use(helmet({
  contentSecurityPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// Wag ipaalam sa lahat kung anong framework/version ginagamit natin.
app.disable('x-powered-by');

app.use(compression());

// Dati open sa lahat yung CORS, kahit sinong website pwede mag-call gamit
// login ng user. Ngayon, yun lang mga nasa CORS_ORIGINS pwede, plus localhost
// Vite server pag dev.
const allowedOrigins = config.isProduction
  ? config.corsOrigins
  : [...config.corsOrigins, 'http://localhost:5173', 'http://127.0.0.1:5173',
     'http://localhost:5500', 'http://127.0.0.1:5500'];

app.use(cors({
  origin(origin, callback) {
    // Walang Origin header = curl o health check, hindi browser, so okay lang.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS.'));
  },
  credentials: true,
}));

// Limit sa request body size, para di ma-abuse ng isang malaking request.
app.use(express.json({ limit: '100kb' }));

app.use('/api', generalLimiter);

// Health check na totoo — sinusuri talaga kung naa-access yung DB, hindi lang
// kung buhay pa yung process.
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    // Nasa server log lang yung detalye, para hindi lumabas sa public response.
    console.error('[health] database unreachable:', err.code || '', err.message);
    res.status(503).json({ status: 'degraded', database: 'unreachable' });
  }
});

// Mas mahigpit na limit sa mga endpoint na pwedeng i-guess (login, register, etc).
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

// Sa production, naka-build na yung Vue app papunta sa ../dist, kaya dito na
// rin sini-serve — same origin, walang CORS hop.
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // Vue Router na bahala sa mga URL, kaya kung hindi API call o totoong file,
  // sa index.html na lang babagsak tapos router na gagalaw.
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  if (err && err.message === 'Origin not allowed by CORS.') {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }

  // Sobrang laking body o sirang JSON — kasalanan ng client yan, hindi ng
  // server, kaya 413 at 400 dapat, hindi generic na 500.
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large.' });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON.' });
  }

  console.error(err);

  // Ayaw i-expose sa response yung details (table names, paths, etc) — sa log
  // na lang.
  res.status(500).json({ error: 'Something went wrong.' });
});

app.listen(config.port, () => {
  console.log(`Group 4 API listening on port ${config.port}`);
  if (!config.isProduction) console.log('Running in development mode.');
});

module.exports = app;
