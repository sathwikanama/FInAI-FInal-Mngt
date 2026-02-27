const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const { getTransactionsController } = require("../controllers/transaction.controller");

// GET all expenses with authentication
router.get("/", authMiddleware, getTransactionsController);

module.exports = router;
