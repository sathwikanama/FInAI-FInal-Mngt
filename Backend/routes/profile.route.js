const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profile.controller');
const authMiddleware = require('../middleware/authMiddleware'); // ✅ FIXED

router.get('/', authMiddleware, profileController.getProfile);
router.put('/', authMiddleware, profileController.saveProfile);

module.exports = router;