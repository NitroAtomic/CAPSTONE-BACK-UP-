// routes/dashboard.js
// Backend and integration: IamAtomic
const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// FR-12: Personalized Dashboard. Everything the dashboard needs in one call
router.get('/', requireAuth, async (req, res) => {
  try {
    const [progress] = await pool.query(
      `SELECT p.completion_status, p.completion_date, m.module_title, m.slug
       FROM progress p JOIN module m ON m.module_id = p.module_id
       WHERE p.user_id = ?`,
      [req.user.user_id]
    );

    // FR-14: Quiz history, most recent first
    const [quizHistory] = await pool.query(
      `SELECT qr.score, qr.total, qr.date_completed, m.module_title, m.slug
       FROM quizresult qr
       JOIN quiz q ON q.quiz_id = qr.quiz_id
       JOIN module m ON m.module_id = q.module_id
       WHERE qr.user_id = ?
       ORDER BY qr.date_completed DESC`,
      [req.user.user_id]
    );

    // FR-11: Most recent assessment
    const [assessmentRows] = await pool.query(
      'SELECT awareness_score AS score, total, awareness_level, by_topic, weak_areas, assessment_date FROM awarenessassessment WHERE user_id = ? ORDER BY assessment_id DESC LIMIT 1',
      [req.user.user_id]
    );

    res.json({
      progress,
      quiz_history: quizHistory,
      assessment: assessmentRows[0] || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard.' });
  }
});

// FR-15: Recommended modules. Based on assessment weak areas if one
// exists, otherwise modules the user hasn't started yet.
router.get('/recommendations', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT weak_areas, by_topic FROM awarenessassessment
       WHERE user_id = ? ORDER BY assessment_id DESC LIMIT 1`,
      [req.user.user_id]
    );

    const latest = rows[0];
    const weakAreas = latest?.weak_areas || [];

    if (weakAreas.length) {
      // Weakest first, so the module they struggled with most is top of the
      // list rather than whichever row the database happened to return.
      const byTopic = latest.by_topic || {};
      const ranked = [...weakAreas].sort((a, b) => {
        const ratio = (t) => {
          const tally = byTopic[t];
          return tally && tally.total ? tally.correct / tally.total : 0;
        };
        return ratio(a) - ratio(b);
      });

      // Matched on slug as well as category. The two drifted apart once
      // already: the assessment recorded weakness in "quishing" while that
      // module's category was "phishing", so it could never be recommended
      // no matter how badly someone scored on it. Checking both means a
      // future rename degrades instead of silently returning nothing.
      const placeholders = ranked.map(() => '?').join(',');
      const [modules] = await pool.query(
        `SELECT module_id, module_title, slug, category, module_type
         FROM module
         WHERE category IN (${placeholders}) OR slug IN (${placeholders})`,
        [...ranked, ...ranked]
      );

      if (modules.length) {
        const position = (m) => {
          const bySlug = ranked.indexOf(m.slug);
          const byCategory = ranked.indexOf(m.category);
          const found = [bySlug, byCategory].filter((i) => i !== -1);
          return found.length ? Math.min(...found) : ranked.length;
        };

        const ordered = modules
          .sort((a, b) => position(a) - position(b))
          .slice(0, 3);

        return res.json(ordered);
      }
    }

    // No assessment yet, or nothing matched. Suggest free modules they have
    // not started, which is a reasonable place to begin.
    const [modules] = await pool.query(
      `SELECT m.module_id, m.module_title, m.slug, m.category, m.module_type
       FROM module m
       WHERE m.module_type = 'Free'
         AND m.module_id NOT IN (SELECT module_id FROM progress WHERE user_id = ?)
       LIMIT 3`,
      [req.user.user_id]
    );
    res.json(modules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load recommendations.' });
  }
});

module.exports = router;
