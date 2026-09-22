// routes/quizzes.js
// IamAtomic — Group 4 Capstone 2, SE-AWARE backend
const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Sabay dapat to sa 70% pass mark sa QuizQuestion.js / QuizResults.vue. Kung
// mababa dyan, hindi dapat "completed" yung module.
const PASSING_SCORE_RATIO = 0.7;

// Kunin yung quiz questions ng isang module (tinatanggal muna yung
// answers/correct_option_index bago ipadala, para hindi makita ng client
// yung answer key)
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

// I-save yung attempt na na-score na (client-side scored yung module quizzes
// dito gamit quiz-data.js, tulad ng /api/assessment/submit — trinust yung
// score na yun, hindi na nire-recompute ulit yung separate question bank
// server-side).
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
      'INSERT INTO quizresult (user_id, quiz_id, score, total, date_completed) VALUES (?, ?, ?, ?, CURDATE())',
      [req.user.user_id, quizRows[0].quiz_id, score, total]
    );
    // Passing lang ang naka-mark na "completed". Kapag failed, "in_progress"
    // ang record, para kita na sinimulan pero hindi pa pasado. Pero kung
    // pasado na dati, hindi na yun babawiin ng failed na retake.
    const passed = total > 0 && score / total >= PASSING_SCORE_RATIO;
    await conn.query(
      `INSERT INTO progress (user_id, module_id, completion_status, completion_date)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         completion_date   = IF(completion_status = 'completed', completion_date, VALUES(completion_date)),
         completion_status = IF(completion_status = 'completed', 'completed', VALUES(completion_status))`,
      [req.user.user_id, moduleId, passed ? 'completed' : 'in_progress', passed ? new Date() : null]
    );
    await conn.commit();
    res.status(201).json({ message: 'Attempt recorded.', passed, status: passed ? 'completed' : 'in_progress' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to record attempt.' });
  } finally {
    conn.release();
  }
});

// FR-04/FR-13/FR-14: Submit ng quiz answers. Server-side scored to (hindi
// dapat trustin yung score na galing sa client), tapos ise-save yung
// quiz_result at ia-update yung progress, isang transaction lang. Gamit lang
// to kung kumpleto na yung quiz_questions bank sa backend para sa quiz na to.
router.post('/:quizId/submit', requireAuth, async (req, res) => {
  const { answers } = req.body; // array ng selected option indices, kasunod ng tanong
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
      'INSERT INTO quizresult (user_id, quiz_id, score, total, date_completed) VALUES (?, ?, ?, ?, CURDATE())',
      [req.user.user_id, req.params.quizId, score, total]
    );
    // Passing lang ang naka-mark na "completed". Kapag failed, "in_progress"
    // ang record, para kita na sinimulan pero hindi pa pasado. Pero kung
    // pasado na dati, hindi na yun babawiin ng failed na retake.
    const passed = total > 0 && score / total >= PASSING_SCORE_RATIO;
    await conn.query(
      `INSERT INTO progress (user_id, module_id, completion_status, completion_date)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         completion_date   = IF(completion_status = 'completed', completion_date, VALUES(completion_date)),
         completion_status = IF(completion_status = 'completed', 'completed', VALUES(completion_status))`,
      [req.user.user_id, quizRows[0].module_id, passed ? 'completed' : 'in_progress', passed ? new Date() : null]
    );
    await conn.commit();

    res.json({ score, total, passed });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to submit quiz.' });
  } finally {
    conn.release();
  }
});

// FR-18: Admin makikita yung buong question bank ng isang quiz, kasama yung
// answer key (di gaya ng GET /by-module/:slug na tinatanggal to para sa
// students), para makapag-edit/delete yung admin panel.
router.get('/:quizId/questions', requireAdmin, async (req, res) => {
  try {
    const [questions] = await pool.query(
      'SELECT question_id, question_text, options, correct_option_index, order_index FROM quizquestion WHERE quiz_id = ? ORDER BY order_index',
      [req.params.quizId]
    );
    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load questions.' });
  }
});

// FR-18: Admin nagdadagdag ng question sa isang quiz
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

// FR-18: Admin nag-eedit ng quiz question (kasama answer key, admin-only route)
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

// FR-18: Admin nagdedelete ng quiz question
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
