const { getFinancialAnalytics } = require('../services/financialEngine');



const testAnalytics = async (req, res) => {

  try {

    const userId = req.user.id;



    const analytics = await getFinancialAnalytics(userId);



    res.status(200).json({

      success: true,

      data: analytics

    });



  } catch (error) {

    console.error("Error in testAnalytics:", error);

    res.status(500).json({

      success: false,

      message: "Failed to fetch financial analytics"

    });

  }

};



const getAnalysis = async (req, res) => {

  try {

    res.json({ message: "Analysis working" });

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};



module.exports = { testAnalytics, getAnalysis };