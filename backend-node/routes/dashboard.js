// routes/dashboard.js
// IamAtomic — Group 4 Capstone 2, SE-AWARE backend
const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// FR-12: Personalized Dashboard. Lahat ng kailangan ng dashboard, isang call
// lang.
router.get('/', requireAuth, async (req, res) => {
  try {
    const [progress] = await pool.query(
      `SELECT p.completion_status, p.completion_date, m.module_title, m.slug
       FROM progress p JOIN module m ON m.module_id = p.module_id
       WHERE p.user_id = ?`,
      [req.user.user_id]
    );

    // FR-14: Quiz history, pinakabago muna
    const [quizHistory] = await pool.query(
      `SELECT qr.score, qr.total, qr.date_completed, m.module_title, m.slug
       FROM quizresult qr
       JOIN quiz q ON q.quiz_id = qr.quiz_id
       JOIN module m ON m.module_id = q.module_id
       WHERE qr.user_id = ?
       ORDER BY qr.date_completed DESC`,
      [req.user.user_id]
    );

    // FR-11: Pinakabagong assessment
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

// FR-15: Mga recommended modules. Base sa weak areas ng assessment kung meron,
// kung wala, yung mga module pa na hindi pa nasimulan.
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
      // Pinakamahina muna, para yung talagang pinaghirapan nila una sa list,
      // hindi basta kung ano lang naibalik ng database.
      const byTopic = latest.by_topic || {};
      const ranked = [...weakAreas].sort((a, b) => {
        const ratio = (t) => {
          const tally = byTopic[t];
          return tally && tally.total ? tally.correct / tally.total : 0;
        };
        return ratio(a) - ratio(b);
      });

      // Tinugma sa slug pati category. Nagkalayo na to minsan: naka-record
      // yung weakness sa "quishing" pero yung category ng module ay
      // "phishing", kaya kahit gaano kababa yung score dun, hindi na-
      // rerecommend. Kapag pareho tinigil, kahit ma-rename pa sa future,
      // mababawasan lang, hindi bigla nawawala yung recommendation.
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

    // Wala pang assessment, o walang tumugma. I-suggest yung Free modules na
    // hindi pa nasisimulan, magandang pinagsisimulan naman.
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
