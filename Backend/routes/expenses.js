const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM transactions WHERE type = 'expense' ORDER BY created_at DESC");

    res.json({
      success: true,
      expenses: rows
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch expenses"
    });
  }
});

module.exports = router;
