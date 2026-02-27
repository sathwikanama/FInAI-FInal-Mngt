const db = require('../config/db');

// Update user profile controller
const updateUserProfile = async (req, res) => {
  try {
    const { name, phoneNumber, studentId, institution, course, year } = req.body;
    const userId = req.user.id; // Get user ID from authenticated user
    
    // Build the UPDATE query dynamically
    let updateFields = [];
    let queryParams = [];
    
    if (name) {
      updateFields.push('name = ?');
      queryParams.push(`name = '${name}'`);
    }
    
    if (phoneNumber) {
      updateFields.push('phone = ?');
      queryParams.push(`phone = '${phoneNumber}'`);
    }
    
    if (studentId) {
      updateFields.push('student_id = ?');
      queryParams.push(`student_id = '${studentId}'`);
    }
    
    if (institution) {
      updateFields.push('institution = ?');
      queryParams.push(`institution = '${institution}'`);
    }
    
    if (course) {
      updateFields.push('course = ?');
      queryParams.push(`course = '${course}'`);
    }
    
    if (year) {
      updateFields.push('year = ?');
      queryParams.push(`year = '${year}'`);
    }
    
    const setClause = updateFields.length > 0 ? updateFields.join(', ') : '';
    const whereClause = queryParams.length > 0 ? `WHERE email = '${req.user.email}'` : `WHERE email = '${req.user.email}'`;
    
    const updateQuery = `
      UPDATE users 
      SET ${setClause}
      ${whereClause}
    `;
    
    console.log('Update query:', updateQuery);
    
    // Execute the update query
    db.query(updateQuery, (err, result) => {
      if (err) {
        console.error('Database update error:', err);
        return res.status(500).json({
          success: false,
          message: 'Database error while updating profile'
        });
      }
      
      console.log('Update result:', result);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found or no changes made'
        });
      }
      
      // Return the updated user data
      const updatedUser = {
        ...req.user,
        name: name || req.user.name,
        phone: phoneNumber || req.user.phone,
        studentId: studentId || req.user.studentId,
        institution: institution || req.user.institution,
        course: course || req.user.course,
        year: year || req.user.year
      };
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser
      });
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

module.exports = { updateUserProfile };
