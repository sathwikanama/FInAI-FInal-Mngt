const db = require("../config/db");

const getCategorySummary = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { month, year } = req.query;

    const query = `
      SELECT category, SUM(amount) AS total
      FROM transactions
      WHERE user_id = ?
      AND type = 'expense'
      AND MONTH(created_at) = ?
      AND YEAR(created_at) = ?
      GROUP BY category
    `;

    const [rows] = await db.query(query, [userId, month, year]);

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error("Category summary error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = { getCategorySummary };