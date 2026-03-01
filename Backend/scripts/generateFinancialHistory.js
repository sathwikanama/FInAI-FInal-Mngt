require('dotenv').config();
const db = require('../config/db');

const categories = {
  "Food & Dining": ["Zomato", "Swiggy", "Cafe Coffee", "Lunch with Friends"],
  "Transport": ["Uber", "Ola", "Metro Recharge", "Fuel"],
  "Shopping": ["Amazon", "Flipkart", "Clothes Purchase", "Electronics"],
  "Bills": ["Electricity Bill", "Water Bill", "Internet Bill", "Mobile Recharge"],
  "Entertainment": ["Netflix", "Movie Tickets", "Spotify", "Weekend Outing"],
  "Healthcare": ["Pharmacy", "Doctor Visit", "Health Checkup"],
  "Education": ["Books", "Online Course", "College Fees"],
  "Other": ["Groceries", "Household Items", "Gifts"],
  "Rent": ["House Rent"]
};

const ranges = {
  "Food & Dining": [150, 1200],
  "Transport": [50, 500],
  "Shopping": [500, 5000],
  "Bills": [500, 10000],
  "Healthcare": [500, 8000],
  "Education": [1000, 50000],
  "Entertainment": [300, 3000],
  "Other": [200, 3000],
  "Rent": [10000, 25000]
};

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateWithinLastYear() {
  const now = new Date();
  const past = new Date();
  past.setDate(now.getDate() - 365);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

const generateHistory = async (userId) => {
  let connection;

  try {
    connection = await db.getConnection();
    console.log("Generating realistic financial data...");

    let totalExpense = 0;
    let transactions = [];

    // ---- Salary entries ----
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      d.setDate(random(1,5));

      transactions.push([
        userId,
        100000,
        "income",
        "Salary",
        "Salary Credit",
        d
      ]);
    }

    // ---- Rent monthly ----
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      d.setDate(random(3,10));

      const amt = random(...ranges["Rent"]);
      totalExpense += amt;

      transactions.push([
        userId,
        amt,
        "expense",
        "Rent",
        "House Rent",
        d
      ]);
    }

    // ---- Random expenses ----
    const targetExpense = random(700000, 800000);

    while (totalExpense < targetExpense && transactions.length < 450) {
      const category = randomItem(Object.keys(categories));
      if (category === "Rent") continue;

      let amount = random(...ranges[category]);
      const description = randomItem(categories[category]);
      const date = randomDateWithinLastYear();

      // Weekend boost
      const day = date.getDay();
      if ((day === 5 || day === 6 || day === 0) &&
          (category === "Food & Dining" || category === "Entertainment")) {
        amount = Math.round(amount * 1.3);
      }

      totalExpense += amount;

      transactions.push([
        userId,
        amount,
        "expense",
        category,
        description,
        date
      ]);
    }

    // ---- Bulk insert ----
    const query = `
      INSERT INTO transactions
      (user_id, amount, type, category, description, created_at)
      VALUES ?
    `;

    await connection.query(query, [transactions]);

    console.log(`Inserted ${transactions.length} transactions`);
    console.log(`Total expense: ₹${totalExpense}`);

  } catch (err) {
    console.error(err);
  } finally {
    if (connection) connection.release();
    process.exit();
  }
};

generateHistory(1);