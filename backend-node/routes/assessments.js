// routes/assessments.js
// IamAtomic — Group 4 Capstone 2, SE-AWARE backend
//
// Yung totoong frontend (assessment-data.js) may sariling fixed na 15-question
// bank at client-side na rin sina-score, kapareho ng ginagawa ng quiz.js sa
// codebase na to. Yung route na to nag-sasave lang ng anumang na-compute ng
// client, hindi na re-score ulit gamit ibang question set sa server.

const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// FR-11: I-save yung resulta ng assessment (na-score na sa client)
router.post('/submit', requireAuth, async (req, res) => {
  const { score, total, level, level_key, by_topic, weak_areas } = req.body;

  if (typeof score !== 'number' || typeof total !== 'number' || !level || !by_topic || !weak_areas) {
    return res.status(400).json({ error: 'score, total, level, level_key, by_topic, and weak_areas are required.' });
  }

  try {
    await pool.query(
      'INSERT INTO awarenessassessment (user_id, awareness_score, total, awareness_level, by_topic, weak_areas, assessment_date) VALUES (?, ?, ?, ?, ?, ?, CURDATE())',
      [req.user.user_id, score, total, level, JSON.stringify(by_topic), JSON.stringify(weak_areas)]
    );
    res.status(201).json({ message: 'Assessment saved.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save assessment.' });
  }
});

// Kunin yung pinakabagong assessment ng naka-login na user
router.get('/latest', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT awareness_score AS score, total, awareness_level, by_topic, weak_areas, assessment_date FROM awarenessassessment WHERE user_id = ? ORDER BY assessment_id DESC LIMIT 1',
      [req.user.user_id]
    );
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load assessment.' });
  }
});

module.exports = router;
