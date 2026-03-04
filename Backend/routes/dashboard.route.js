const express = require('express');
const router = express.Router();

const { getDashboardController } = require('../controllers/dashboard.controller');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getDashboardController);

module.exports = router;