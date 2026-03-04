const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware'); // ✅ FIXED
const db = require('../config/db');

// Test route
router.get('/test', (req, res) => {
  res.send("CATEGORY ROUTE WORKING");
});

// GET /api/transactions/category-summary
router.get('/category-summary', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT category, SUM(amount) AS total
       FROM transactions
       WHERE user_id = ? AND type = 'expense'
       GROUP BY category`,
      [userId]
    );

    const formatted = rows.map(r => ({
      category: r.category,
      total: Number(r.total) || 0
    }));

    res.json({
      success: true,
      data: formatted
    });

  } catch (err) {
    console.error('Category summary error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      data: null
    });
  }
});

module.exports = router;