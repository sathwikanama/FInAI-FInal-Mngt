const db = require('../config/db');

const getFinancialAnalytics = async (userId) => {
  let connection;

  try {
    connection = await db.getConnection();

    const [transactions] = await connection.execute(
      'SELECT amount, type, category, created_at FROM transactions WHERE user_id = ? ORDER BY created_at ASC',
      [userId]
    );

    const monthlyData = {};
    const categoryTotals = {};

    let totalExpense = 0;
    let totalIncome = 0;   // 🔥 ADDED

    transactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount);
      const date = new Date(transaction.created_at);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          income: 0,
          expense: 0
        };
      }

      if (transaction.type === 'income') {
        monthlyData[monthKey].income += amount;
        totalIncome += amount;   // 🔥 ADDED
      } 
      else if (transaction.type === 'expense') {
        monthlyData[monthKey].expense += amount;
        totalExpense += amount;

        if (!categoryTotals[transaction.category]) {
          categoryTotals[transaction.category] = 0;
        }
        categoryTotals[transaction.category] += amount;
      }
    });

    const monthlyDataArray = Object.values(monthlyData).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    const monthsWithExpenses = monthlyDataArray.filter(
      month => month.expense > 0
    );

    const averageMonthlyExpense =
      monthsWithExpenses.length > 0
        ? totalExpense / monthsWithExpenses.length
        : 0;

    let growthRate = 0;

    if (monthlyDataArray.length >= 2) {
      const expenses = monthlyDataArray.map(month => month.expense);

      let totalGrowth = 0;
      let growthPeriods = 0;

      for (let i = 1; i < expenses.length; i++) {
        if (expenses[i - 1] > 0) {
          const growth =
            ((expenses[i] - expenses[i - 1]) / expenses[i - 1]) * 100;

          totalGrowth += growth;
          growthPeriods++;
        }
      }

      growthRate =
        growthPeriods > 0 ? totalGrowth / growthPeriods : 0;
    }

    const roundedMonthlyData = monthlyDataArray.map(month => ({
      month: month.month,
      income: Math.round(month.income * 100) / 100,
      expense: Math.round(month.expense * 100) / 100
    }));

    const roundedCategoryTotals = {};
    for (const [category, total] of Object.entries(categoryTotals)) {
      roundedCategoryTotals[category] =
        Math.round(total * 100) / 100;
    }

    return {
      totalIncome: Math.round(totalIncome * 100) / 100,   // 🔥 ADDED
      totalExpense: Math.round(totalExpense * 100) / 100, // optional but useful
      monthlyData: roundedMonthlyData,
      categoryTotals: roundedCategoryTotals,
      averageMonthlyExpense: Math.round(averageMonthlyExpense * 100) / 100,
      growthRate: Math.round(growthRate * 100) / 100
    };

  } catch (error) {
    console.error('Error getting financial analytics:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = { getFinancialAnalytics };