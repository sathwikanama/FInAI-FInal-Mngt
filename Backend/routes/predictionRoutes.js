const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { testPrediction } = require('../controllers/predictionController');

router.get('/test', authMiddleware, testPrediction);

module.exports = router;
