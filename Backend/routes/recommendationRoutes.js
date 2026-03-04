const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { testRecommendations } = require('../controllers/recommendationController');

router.get('/test', authMiddleware, testRecommendations);

module.exports = router;
