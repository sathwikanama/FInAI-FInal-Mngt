const db = require('../config/db');

// User related functions
const findUserByEmail = async (email) => {
  const connection = await db.getConnection();
  try {
    const [users] = await connection.execute(
      'SELECT id, email, password, created_at FROM users WHERE email = ?',
      [email]
    );
    return users.length > 0 ? users[0] : null;
  } finally {
    connection.release();
  }
};

const createUser = async (email, hashedPassword) => {
  const connection = await db.getConnection();
  try {
    const [result] = await connection.execute(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );
    return {
      id: result.insertId,
      email,
      createdAt: new Date().toISOString()
    };
  } finally {
    connection.release();
  }
};

// Transaction related functions
const createTransaction = async (userId, amount, type, category, description, merchant_name = null, payment_method = null, transaction_date = null) => {
  const connection = await db.getConnection();
  try {
    // Use provided transaction_date or current date
    const dateToUse = transaction_date || new Date().toISOString().split('T')[0];
    
    const [result] = await connection.execute(
      `INSERT INTO transactions 
      (user_id, amount, type, category, description, merchant_name, payment_method, transaction_date, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, amount, type, category, description, merchant_name, payment_method, dateToUse]
    );

    // Return the complete transaction object
    return {
      id: result.insertId,
      user_id: userId,
      amount: parseFloat(amount),
      type,
      category,
      description,
      merchant_name,
      payment_method,
      transaction_date: dateToUse,
      created_at: new Date().toISOString()
    };
  } finally {
    connection.release();
  }
};

const getUserTransactions = async (userId, filters = {}) => {
  try {
    const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
    const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
    const offset = (page - 1) * limit;

    console.log("POOL DEBUG:", { userId, limit, offset, filters });

    // Build WHERE conditions
   const whereConditions = ['user_id = ?', 'type = ?'];
const queryParams = [Number(userId), 'expense'];

    console.log("🔍 Base WHERE conditions:", whereConditions);
    console.log("🔍 Base query params:", queryParams);
    console.log("🔍 Input filters:", filters);

    // Add category filter if provided
    if (filters.category) {
      whereConditions.push('category = ?');
      queryParams.push(filters.category);
    }

    // Add month/year filter if provided (safer logic - only add if not "all")
    if (filters.month && filters.month !== "all") {
      whereConditions.push('MONTH(created_at) = ?');
      queryParams.push(filters.month);
      console.log("📅 Month filter added to SQL:", filters.month);
      console.log("📅 Updated WHERE conditions:", whereConditions);
      console.log("📅 Updated query params:", queryParams);
    }
    
    if (filters.year && filters.year !== "all") {
      whereConditions.push('YEAR(created_at) = ?');
      queryParams.push(filters.year);
      console.log("📅 Year filter added to SQL:", filters.year);
      console.log("📅 Updated WHERE conditions:", whereConditions);
      console.log("📅 Updated query params:", queryParams);
    }

    // Add search filter if provided
    if (filters.search) {
      whereConditions.push('(description LIKE ? OR category LIKE ?)');
      const searchTerm = `%${filters.search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    // Build the final query
    const whereClause = whereConditions.join(' AND ');
    const query = `
      SELECT id, amount, type, category, description, created_at
      FROM transactions
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    console.log("🔍 Final SQL Query:", query);
    console.log("🔍 Query Parameters:", queryParams);

    const [rows] = await db.execute(query, queryParams);

    console.log("📊 Query Results:", rows.length, "rows found");
    if (rows.length > 0) {
      console.log("📋 Sample rows with dates:", rows.slice(0, 3).map(row => ({
        id: row.id,
        amount: row.amount,
        category: row.category,
        created_at: row.created_at,
        month: new Date(row.created_at).getMonth() + 1,
        year: new Date(row.created_at).getFullYear()
      })));
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transactions
      WHERE ${whereClause}
    `;
    const [countResult] = await db.execute(countQuery, queryParams);
    const total = countResult[0].total;

    return {
      transactions: rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit
    };

  } catch (error) {
    console.error("POOL ERROR:", error);
    throw error;
  }
};

module.exports = {
  findUserByEmail,
  createUser,
  createTransaction,
  getUserTransactions
};
