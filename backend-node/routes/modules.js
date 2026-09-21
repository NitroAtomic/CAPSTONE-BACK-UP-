// routes/modules.js
// IamAtomic — Group 4 Capstone 2, SE-AWARE backend
const express = require('express');
const pool = require('../config/db');
const { optionalAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper: may access ba to sa Premium content?
async function hasPremiumAccess(user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const [rows] = await pool.query(
    "SELECT subscription_type, subscription_status FROM user WHERE user_id = ?",
    [user.user_id]
  );
  if (rows.length === 0) return false;
  return rows[0].subscription_type === 'Premium' && rows[0].subscription_status === 'active';
}

// Public teaser list ng Premium catalog: title/summary/category lang, para sa
// lahat ng module_type = 'Premium' (kasama admin-created), kahit hindi
// naka-login o Free lang, para makita yung value ng pag-upgrade. Walang
// description/video_url pa rito, nasa GET /:slug pa yun.
router.get('/premium-list', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT module_id, module_title, description, category, slug FROM module WHERE module_type = 'Premium' ORDER BY module_title"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load premium modules.' });
  }
});

// List ng modules. Free modules kita ng lahat, Premium para lang sa
// Premium/admin. Server-side to check, hindi lang tago sa frontend UI.
router.get('/', optionalAuth, async (req, res) => {
  try {
    const premium = await hasPremiumAccess(req.user);
    const [rows] = premium
      ? await pool.query('SELECT * FROM module ORDER BY module_type, module_title')
      : await pool.query("SELECT * FROM module WHERE module_type = 'Free' ORDER BY module_title");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load modules.' });
  }
});

// Kunin yung isang module by slug. 403 kung Premium tapos hindi entitled.
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM module WHERE slug = ?', [req.params.slug]);
    if (rows.length === 0) return res.status(404).json({ error: 'Module not found.' });

    const module = rows[0];
    if (module.module_type === 'Premium' && !(await hasPremiumAccess(req.user))) {
      return res.status(403).json({ error: 'This module requires a Premium subscription.' });
    }
    res.json(module);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load module.' });
  }
});

// FR-17: Admin gumagawa ng module (auto-creates yung quiz row nito)
router.post('/', requireAdmin, async (req, res) => {
  const { module_title, description, module_type, category, slug, video_url } = req.body;
  if (!module_title || !slug) {
    return res.status(400).json({ error: 'module_title and slug are required.' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO module (module_title, description, module_type, category, slug, video_url) VALUES (?, ?, ?, ?, ?, ?)',
      [module_title, description || null, module_type === 'Premium' ? 'Premium' : 'Free', category || null, slug, video_url || null]
    );
    await conn.query(
      'INSERT INTO quiz (module_id, title, number_of_questions) VALUES (?, ?, 0)',
      [result.insertId, module_title + ' Quiz']
    );
    await conn.commit();
    res.status(201).json({ module_id: result.insertId });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A module with that slug already exists.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create module.' });
  } finally {
    conn.release();
  }
});

// FR-17: Admin edits ng module (FR-19 din — yung Free/Premium switch, normal
// field update lang to sa parehong route)
router.put('/:id', requireAdmin, async (req, res) => {
  const { module_title, description, module_type, category, slug, video_url } = req.body;
  try {
    await pool.query(
      'UPDATE module SET module_title = ?, description = ?, module_type = ?, category = ?, slug = ?, video_url = COALESCE(?, video_url) WHERE module_id = ?',
      [module_title, description, module_type, category, slug, video_url, req.params.id]
    );
    res.json({ message: 'Module updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update module.' });
  }
});

// FR-17: Admin deletes ng module
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM module WHERE module_id = ?', [req.params.id]);
    res.json({ message: 'Module deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete module.' });
  }
});

module.exports = router;
