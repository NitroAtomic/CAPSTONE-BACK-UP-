// routes/quizzes.js
// Backend and integration: IamAtomic
const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get a module's quiz questions (answers/correct_option_index are stripped
// out before sending, so the client cannot see the answer key)
router.get('/by-module/:slug', optionalAuth, async (req, res) => {
  try {
    const [modRows] = await pool.query('SELECT module_id, module_type FROM module WHERE slug = ?', [req.params.slug]);
    if (modRows.length === 0) return res.status(404).json({ error: 'Module not found.' });

    if (modRows[0].module_type === 'Premium') {
      const isAdmin = req.user && req.user.role === 'admin';
      let premium = isAdmin;
      if (!premium && req.user) {
        const [u] = await pool.query('SELECT subscription_type, subscription_status FROM user WHERE user_id = ?', [req.user.user_id]);
        premium = u[0] && u[0].subscription_type === 'Premium' && u[0].subscription_status === 'active';
      }
      if (!premium) return res.status(403).json({ error: 'This quiz requires a Premium subscription.' });
    }

    const [quizRows] = await pool.query('SELECT quiz_id, title FROM quiz WHERE module_id = ?', [modRows[0].module_id]);
    if (quizRows.length === 0) return res.status(404).json({ error: 'No quiz found for this module.' });

    const [questions] = await pool.query(
      'SELECT question_id, question_text, options, order_index FROM quizquestion WHERE quiz_id = ? ORDER BY order_index',
      [quizRows[0].quiz_id]
    );
    res.json({ quiz_id: quizRows[0].quiz_id, title: quizRows[0].title, questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load quiz.' });
  }
});

// Records an already-scored quiz attempt directly (module quizzes in this
// codebase are scored entirely client-side via quiz-data.js, so this trusts
// that score, the same way /api/assessment/submit trusts the client-computed
// assessment result, rather than requiring a second, separately-seeded
// question bank per module just to re-score server-side).
router.post('/record-attempt', requireAuth, async (req, res) => {
  const { slug, score, total } = req.body;
  if (!slug || typeof score !== 'number' || typeof total !== 'number') {
    return res.status(400).json({ error: 'slug, score, and total are required.' });
  }
  const conn = await pool.getConnection();
  try {
    const [modRows] = await conn.query('SELECT module_id FROM module WHERE slug = ?', [slug]);
    if (modRows.length === 0) return res.status(404).json({ error: 'Module not found.' });
    const moduleId = modRows[0].module_id;

    const [quizRows] = await conn.query('SELECT quiz_id FROM quiz WHERE module_id = ?', [moduleId]);
    if (quizRows.length === 0) return res.status(404).json({ error: 'No quiz found for this module.' });

    await conn.beginTransaction();
    await conn.query(
      'INSERT INTO quizresult (user_id, quiz_id, score, total) VALUES (?, ?, ?, ?)',
      [req.user.user_id, quizRows[0].quiz_id, score, total]
    );
    await conn.query(
      `INSERT INTO progress (user_id, module_id, completion_status, completion_date)
       VALUES (?, ?, 'completed', NOW())
       ON DUPLICATE KEY UPDATE completion_status = 'completed', completion_date = NOW()`,
      [req.user.user_id, moduleId]
    );
    await conn.commit();
    res.json({ message: 'Attempt recorded.' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to record attempt.' });
  } finally {
    conn.release();
  }
});

// FR-04/FR-13/FR-14: Submit quiz answers. Scored server-side (never trust
// a client-submitted score), then records both the quiz_result and updates
// progress for the module in one transaction. Used when the backend's own
// quiz_questions bank for this quiz has been fully seeded to match.
router.post('/:quizId/submit', requireAuth, async (req, res) => {
  const { answers } = req.body; // array of selected option indices, in question order
  if (!Array.isArray(answers)) {
    return res.status(400).json({ error: 'answers must be an array of selected option indices.' });
  }

  const conn = await pool.getConnection();
  try {
    const [questions] = await conn.query(
      'SELECT question_id, correct_option_index FROM quizquestion WHERE quiz_id = ? ORDER BY order_index',
      [req.params.quizId]
    );
    if (questions.length === 0) return res.status(404).json({ error: 'Quiz has no questions.' });

    let score = 0;
    questions.forEach((q, i) => { if (answers[i] === q.correct_option_index) score++; });
    const total = questions.length;

    const [quizRows] = await conn.query('SELECT module_id FROM quiz WHERE quiz_id = ?', [req.params.quizId]);
    if (quizRows.length === 0) return res.status(404).json({ error: 'Quiz not found.' });

    await conn.beginTransaction();
    await conn.query(
      'INSERT INTO quizresult (user_id, quiz_id, score, total) VALUES (?, ?, ?, ?)',
      [req.user.user_id, req.params.quizId, score, total]
    );
    await conn.query(
      `INSERT INTO progress (user_id, module_id, completion_status, completion_date)
       VALUES (?, ?, 'completed', NOW())
       ON DUPLICATE KEY UPDATE completion_status = 'completed', completion_date = NOW()`,
      [req.user.user_id, quizRows[0].module_id]
    );
    await conn.commit();

    res.json({ score, total });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to submit quiz.' });
  } finally {
    conn.release();
  }
});

// FR-18: Admin adds a question to a quiz
router.post('/:quizId/questions', requireAdmin, async (req, res) => {
  const { question_text, options, correct_option_index, order_index } = req.body;
  if (!question_text || !Array.isArray(options) || correct_option_index === undefined) {
    return res.status(400).json({ error: 'question_text, options (array), and correct_option_index are required.' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO quizquestion (quiz_id, question_text, options, correct_option_index, order_index) VALUES (?, ?, ?, ?, ?)',
      [req.params.quizId, question_text, JSON.stringify(options), correct_option_index, order_index || 0]
    );
    await pool.query(
      'UPDATE quiz SET number_of_questions = (SELECT COUNT(*) FROM quizquestion WHERE quiz_id = ?) WHERE quiz_id = ?',
      [req.params.quizId, req.params.quizId]
    );
    res.status(201).json({ question_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add question.' });
  }
});

// FR-18: Admin edits a quiz question (includes the answer key, admin-only route)
router.put('/questions/:questionId', requireAdmin, async (req, res) => {
  const { question_text, options, correct_option_index, order_index } = req.body;
  try {
    await pool.query(
      'UPDATE quizquestion SET question_text = ?, options = ?, correct_option_index = ?, order_index = ? WHERE question_id = ?',
      [question_text, JSON.stringify(options), correct_option_index, order_index, req.params.questionId]
    );
    res.json({ message: 'Question updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update question.' });
  }
});

// FR-18: Admin deletes a quiz question
router.delete('/questions/:questionId', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT quiz_id FROM quizquestion WHERE question_id = ?', [req.params.questionId]);
    await pool.query('DELETE FROM quizquestion WHERE question_id = ?', [req.params.questionId]);
    if (rows.length) {
      await pool.query(
        'UPDATE quiz SET number_of_questions = (SELECT COUNT(*) FROM quizquestion WHERE quiz_id = ?) WHERE quiz_id = ?',
        [rows[0].quiz_id, rows[0].quiz_id]
      );
    }
    res.json({ message: 'Question deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete question.' });
  }
});

module.exports = router;
