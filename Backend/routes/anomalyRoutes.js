const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { testAnomalies } = require('../controllers/anomalyController');

router.get('/test', authMiddleware, testAnomalies);

module.exports = router;
