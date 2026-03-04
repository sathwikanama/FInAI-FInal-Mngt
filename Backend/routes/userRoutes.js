const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware'); // ✅ FIXED
const { updateUserProfile } = require('../controllers/userController');

// Apply auth middleware to all user routes
router.use(authMiddleware);

// PUT /api/user/update - Update user profile
router.put('/update', updateUserProfile);

module.exports = router;