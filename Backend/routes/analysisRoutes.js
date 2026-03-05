const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { testAnalytics } = require('../controllers/analysisController');
console.log(typeof authMiddleware);
console.log(typeof testAnalytics);
router.get('/test', authMiddleware, testAnalytics);

module.exports = router;