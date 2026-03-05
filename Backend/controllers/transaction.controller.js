const { createTransaction, getUserTransactions } = require('../services/database.service');

const createTransactionController = async (req, res) => {
  const { amount, type, category, description, merchant_name, payment_method, transaction_date } = req.body;
  
  // Log req.user to confirm it exists
  console.log("REQ USER:", req.user);
  console.log("REQ BODY:", req.body);
  
  // Extract userId safely
  const userId = req.user?.id || req.user?.userId || null;

  // If userId is missing, return 401 response
  if (!userId) {
    return res.status(401).json({ 
      success: false, 
      message: "Unauthorized" 
    });
  }

  // Basic validation
  if (!amount || !type || !category) {
    return res.status(400).json({
      success: false,
      message: 'Amount, type, and category are required',
      data: null
    });
  }

  // Validate amount
  if (isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be a positive number',
      data: null
    });
  }

  // Validate type
  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Type must be either income or expense',
      data: null
    });
  }

  try {
    // Use userId in the INSERT query
    const transaction = await createTransaction(userId, amount, type, category, description, merchant_name, payment_method, transaction_date);
    
    console.log(`✅ Transaction created: ${type} - ${amount} (${category}) for user ${userId}`);

    // Return the complete transaction object
    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction  // Return transaction directly, not wrapped
    });
  } catch (error) {
    // Add try/catch with console.error for debugging
    console.error("ADD TRANSACTION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

const getTransactionsController = async (req, res) => {
  // Log JWT payload for debugging
  console.log("JWT USER:", req.user);
  
  // Safely read user ID from JWT
  const userId =
    req.user?.id ||
    req.user?.userId ||
    req.user?.data?.id;

  // If userId is missing, return authentication error
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "User not authenticated"
    });
  }

  // Extract filter parameters from query
  const { category, month, year, search, page, limit } = req.query;
  
  console.log("🔍 Backend Query params:", req.query);
  console.log("📅 Month/Year received:", { month, year });
  console.log("📅 Month/Year types:", { 
    monthType: typeof month, 
    yearType: typeof year,
    monthValue: month,
    yearValue: year 
  });
  
  // Build filters object
  const filters = {
    page: Number(page) || 1,
    limit: Number(limit) || 10
  };

  // Add optional filters if provided
  if (category && category !== 'All') {
    filters.category = category;
    console.log("🏷️ Category filter added:", category);
  }
  
  if (month) {
    filters.month = month;
    console.log("📅 Month filter added:", month);
  }
  
  if (year) {
    filters.year = year;
    console.log("📅 Year filter added:", year);
  }
  
  if (search) {
    filters.search = search;
    console.log("🔍 Search filter added:", search);
  }

  console.log("🎯 Final filters object:", filters);

  try {
    const result = await getUserTransactions(userId, filters);
    
    console.log(`✅ Retrieved ${result.transactions.length} transactions for user ${userId} with filters:`, filters);

    res.json({
      success: true,
      message: 'Transactions retrieved successfully',
      data: result.transactions  // Return transactions array directly
    });
  } catch (error) {
    console.error('❌ Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null
    });
  }
};

const deleteTransactionController = async (req, res) => {
  const { id } = req.params;
  
  // Log JWT payload for debugging
  console.log("JWT USER:", req.user);
  
  // Safely read user ID from JWT
  const userId =
    req.user?.id ||
    req.user?.userId ||
    req.user?.data?.id;

  // If userId is missing, return authentication error
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "User not authenticated"
    });
  }

  // Basic validation
  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid transaction ID is required',
      data: null
    });
  }

  let connection;
  try {
    connection = await require('../config/db').getConnection();
    
    // First check if transaction belongs to user
    const [transactions] = await connection.execute(
      'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or access denied',
        data: null
      });
    }

    // Delete the transaction
    await connection.execute(
      'DELETE FROM transactions WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    console.log(`✅ Transaction deleted: ID ${id} for user ${userId}`);

    res.json({
      success: true,
      message: 'Transaction deleted successfully',
      data: null
    });
  } catch (error) {
    console.error('❌ Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null
    });
  } finally {
    if (connection) connection.release();
  }
};

const updateTransactionController = async (req, res) => {
  const { id } = req.params;
  const { amount, type, category, description } = req.body;
  
  // Log JWT payload for debugging
  console.log("JWT USER:", req.user);
  
  // Safely read user ID from JWT
  const userId =
    req.user?.id ||
    req.user?.userId ||
    req.user?.data?.id;

  // If userId is missing, return authentication error
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "User not authenticated"
    });
  }

  // Basic validation
  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid transaction ID is required',
      data: null
    });
  }

  // Validate required fields
  if (!amount || !type || !category) {
    return res.status(400).json({
      success: false,
      message: 'Amount, type, and category are required',
      data: null
    });
  }

  // Validate amount
  if (isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be a positive number',
      data: null
    });
  }

  // Validate type
  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Type must be either income or expense',
      data: null
    });
  }

  let connection;
  try {
    connection = await require('../config/db').getConnection();
    
    // First check if transaction belongs to user
    const [transactions] = await connection.execute(
      'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or access denied',
        data: null
      });
    }

    // Update the transaction
    await connection.execute(
      'UPDATE transactions SET amount = ?, type = ?, category = ?, description = ? WHERE id = ? AND user_id = ?',
      [amount, type, category, description, id, userId]
    );

    console.log(`✅ Transaction updated: ID ${id} for user ${userId}`);

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: null
    });
  } catch (error) {
    console.error('❌ Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null
    });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  createTransactionController,
  getTransactionsController,
  deleteTransactionController,
  updateTransactionController
};
