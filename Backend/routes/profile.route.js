const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/profile - Get user profile
router.get('/', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Profile retrieved successfully',
    data: { 
      user: req.user 
    }
  });
});

// PUT /api/profile/update - Update user profile
router.put('/update', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, studentId, institution, course, year } = req.body;
    
    // Update user in database (this would typically update your User model)
    // For now, we'll just return success with the updated data
    const updatedUser = {
      ...req.user,
      name: name || req.user.name,
      email: email || req.user.email,
      phone: phone || req.user.phone,
      studentId: studentId || req.user.studentId,
      institution: institution || req.user.institution,
      course: course || req.user.course,
      year: year || req.user.year
    };
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

module.exports = router;
