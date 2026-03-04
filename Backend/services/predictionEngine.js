const { getFinancialAnalytics } = require('./financialEngine');

const getExpensePrediction = async (userId) => {
  try {
    const analytics = await getFinancialAnalytics(userId);

    const monthlyData = analytics.monthlyData || [];
    const totalIncome = analytics.totalIncome || 0;

    const expenses = monthlyData.map(month => month.expense);

    if (expenses.length < 2) {
      return {
        predictedExpense: 0,
        slope: 0,
        trend: "Stable",
        confidence: 'Low',
        monthsAnalyzed: expenses.length,
        r2Score: 0,
        historicalData: [],
        riskStatus: "Low",
        spendingRatio: 0
      };
    }

    const n = expenses.length;

    // X values (1 to n)
    const x = Array.from({ length: n }, (_, i) => i + 1);
    const y = expenses;

    // Required sums
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + (xi * y[i]), 0);
    const sumXX = x.reduce((total, xi) => total + (xi * xi), 0);

    const denominator = (n * sumXX - sumX * sumX);

    if (denominator === 0) {
      return {
        predictedExpense: 0,
        slope: 0,
        trend: "Stable",
        confidence: 'Low',
        monthsAnalyzed: n,
        r2Score: 0,
        historicalData: [],
        riskStatus: "Low",
        spendingRatio: 0
      };
    }

    // Linear Regression
    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    const nextMonthPrediction = slope * (n + 1) + intercept;

    // ===== R² Calculation =====
    const meanY = sumY / n;
    let ssTotal = 0;
    let ssResidual = 0;

    for (let i = 0; i < n; i++) {
      const predictedY = slope * x[i] + intercept;
      ssTotal += Math.pow(y[i] - meanY, 2);
      ssResidual += Math.pow(y[i] - predictedY, 2);
    }

    const r2 = ssTotal === 0 ? 0 : 1 - (ssResidual / ssTotal);

    // ===== Confidence =====
    let confidence;
    if (r2 >= 0.75) {
      confidence = 'High';
    } else if (r2 >= 0.5) {
      confidence = 'Medium';
    } else {
      confidence = 'Low';
    }

    const trend =
      slope > 0 ? 'Increasing' :
      slope < 0 ? 'Decreasing' :
      'Stable';

    // ===== Risk Status Calculation =====
    const avgMonthlyIncome = totalIncome > 0 ? totalIncome / n : 0;
    const spendingRatio =
      avgMonthlyIncome > 0 ? nextMonthPrediction / avgMonthlyIncome : 0;

    let riskStatus;
    if (spendingRatio < 0.5) {
      riskStatus = "Low";
    } else if (spendingRatio < 0.8) {
      riskStatus = "Moderate";
    } else {
      riskStatus = "High";
    }

    // Historical Data for Chart
    const historicalData = monthlyData.map((month, index) => ({
      month: month.month,
      amount: month.expense,
      index: index + 1
    }));

    return {
      predictedExpense: Math.round(nextMonthPrediction * 100) / 100,
      slope: Math.round(slope * 100) / 100,
      trend,
      confidence,
      monthsAnalyzed: n,
      r2Score: Math.round(r2 * 100) / 100,
      historicalData,
      riskStatus,
      spendingRatio: Math.round(spendingRatio * 100) // %
    };

  } catch (error) {
    console.error('Error getting expense prediction:', error);
    throw error;
  }
};

module.exports = { getExpensePrediction };