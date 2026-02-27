const getCategorySummary = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Category summary endpoint working"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = { getCategorySummary };
