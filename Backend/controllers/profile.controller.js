const db = require('../models');   // import whole db object
const Profile = db.Profile;        // get Profile model from it


// GET profile
exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({
      where: { user_id: req.user.id }
    });

    return res.json({
      success: true,
      message: "Profile retrieved successfully",
      data: profile
    });

  } catch (err) {
    console.error("PROFILE GET ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// CREATE or UPDATE profile
exports.saveProfile = async (req, res) => {
  try {
    const { full_name, phone, country, city, occupation } = req.body;

    let profile = await Profile.findOne({
      where: { user_id: req.user.id }
    });

    if (profile) {
      await profile.update({ full_name, phone, country, city, occupation });
    } else {
      profile = await Profile.create({
        user_id: req.user.id,
        full_name,
        phone,
        country,
        city,
        occupation
      });
    }

    return res.json({
      success: true,
      message: "Profile saved successfully",
      data: profile
    });

  } catch (err) {
    console.error("PROFILE SAVE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};