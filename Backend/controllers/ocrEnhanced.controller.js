/**
 * Enhanced OCR Controller with Auto-Transaction Creation
 * Integrates OCR parsing with financial modules
 */

const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs').promises;
const ocrParser = require('../services/ocrParser.service');
const { Transaction } = require('../models');
const db = require('../config/db');

class OCREnhancedController {
  /**
   * Process receipt and create transaction automatically
   */
  async processReceiptAndCreateTransaction(req, res) {
    let connection;
    let tempImagePath = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file uploaded"
        });
      }

      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: "User authentication required"
        });
      }

      const userId = req.user.id;
      tempImagePath = path.resolve(req.file.path);

      console.log(`🔍 Starting OCR processing for user ${userId}`);

      // Step 1: Extract text using Tesseract
      const { data: { text, confidence: ocrConfidence } } = await Tesseract.recognize(
        tempImagePath,
        'eng',
        {
          logger: m => console.log(`OCR: ${m.status} - ${Math.round(m.progress * 100)}%`)
        }
      );

      if (!text || text.trim().length < 10) {
        return res.json({
          success: false,
          message: "OCR failed to extract sufficient text",
          data: { ocrConfidence: ocrConfidence || 0 }
        });
      }

      console.log(`📝 OCR extracted text (${text.length} chars) with confidence: ${ocrConfidence}%`);

      // Step 2: Parse receipt data intelligently
      const extractedData = ocrParser.parseReceiptText(text, userId);
      
      console.log(`🧠 Parsed data:`, extractedData);

      if (!extractedData.total_amount) {
        return res.json({
          success: false,
          message: "Could not extract total amount from receipt",
          data: { extractedData, ocrConfidence }
        });
      }

      // Step 3: Create transaction
      connection = await db.getConnection();

      const transactionData = {
        user_id: userId,
        amount: extractedData.total_amount,
        type: 'expense',
        category: extractedData.category || 'uncategorized',
        description: `OCR: ${extractedData.merchant_name || 'Receipt'}`,
        merchant_name: extractedData.merchant_name,
        payment_method: extractedData.payment_method,
        transaction_date: extractedData.date,
        ocr_confidence: ocrConfidence,
        parsing_confidence: extractedData.confidence,
        raw_text: text.substring(0, 1000), // Store first 1000 chars
        created_at: new Date()
      };

      let transactionId;
      
      // Try to insert with OCR columns first
      try {
        const [result] = await connection.execute(
          `INSERT INTO transactions (
            user_id, amount, type, category, description, 
            merchant_name, payment_method, transaction_date,
            ocr_confidence, parsing_confidence, raw_text, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            transactionData.user_id,
            transactionData.amount,
            transactionData.type,
            transactionData.category,
            transactionData.description,
            transactionData.merchant_name,
            transactionData.payment_method,
            transactionData.transaction_date,
            transactionData.ocr_confidence,
            transactionData.parsing_confidence,
            transactionData.raw_text,
            transactionData.created_at
          ]
        );
        transactionId = result.insertId;
        console.log(`💰 Transaction created with OCR data - ID: ${transactionId}`);
      } catch (error) {
        if (error.code === 'ER_BAD_FIELD_ERROR') {
          console.log('⚠️ OCR columns not found, using basic transaction insert...');
          
          // Fallback to basic columns only
          const [result] = await connection.execute(
            `INSERT INTO transactions (
              user_id, amount, type, category, description, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              transactionData.user_id,
              transactionData.amount,
              transactionData.type,
              transactionData.category,
              transactionData.description,
              transactionData.created_at
            ]
          );
          transactionId = result.insertId;
          console.log(`💰 Transaction created with basic data - ID: ${transactionId}`);
        } else {
          throw error;
        }
      }

      // Step 4: Get updated dashboard data (with safety check)
      let dashboardData = null;
      try {
        dashboardData = await this.getUpdatedDashboardData(connection, userId);
      } catch (error) {
        console.error('⚠️ Dashboard data fetch failed:', error.message);
        dashboardData = { error: 'Dashboard data unavailable' };
      }

      // Step 5: Get updated analytics (with safety check)
      let analyticsData = null;
      try {
        analyticsData = await this.getUpdatedAnalytics(connection, userId);
      } catch (error) {
        console.error('⚠️ Analytics data fetch failed:', error.message);
        analyticsData = { error: 'Analytics data unavailable' };
      }

      // Step 6: Generate predictions (with safety check)
      let predictionsData = null;
      try {
        predictionsData = await this.generatePredictions(connection, userId);
      } catch (error) {
        console.error('⚠️ Predictions generation failed:', error.message);
        predictionsData = { error: 'Predictions unavailable' };
      }

      // Step 7: Check for anomalies (with safety check)
      let anomalyData = null;
      try {
        anomalyData = await this.detectAnomalies(connection, userId, extractedData.total_amount);
      } catch (error) {
        console.error('⚠️ Anomaly detection failed:', error.message);
        anomalyData = { error: 'Anomaly detection unavailable' };
      }

      // Step 8: Generate insights (with safety check)
      let insightsData = null;
      try {
        insightsData = await this.generateInsights(connection, userId, extractedData);
      } catch (error) {
        console.error('⚠️ Insights generation failed:', error.message);
        insightsData = { error: 'Insights unavailable' };
      }

      console.log(`✅ OCR processing completed successfully`);

      return res.json({
        success: true,
        message: "Receipt processed and transaction created successfully",
        data: {
          transaction: {
            id: transactionId,
            ...transactionData
          },
          extracted_data: extractedData,
          ocr_confidence: ocrConfidence,
          dashboard: dashboardData,
          analytics: analyticsData,
          predictions: predictionsData,
          anomaly: anomalyData,
          insights: insightsData
        }
      });

    } catch (error) {
      console.error("❌ OCR Enhanced Error:", error);
      return res.status(500).json({
        success: false,
        message: "OCR processing failed",
        error: error.message
      });
    } finally {
      if (connection) connection.release();
      
      // Clean up temporary file
      if (tempImagePath) {
        try {
          await fs.unlink(tempImagePath);
          console.log(`🗑️ Cleaned up temp file: ${tempImagePath}`);
        } catch (cleanupError) {
          console.error("Cleanup error:", cleanupError);
        }
      }
    }
  }

  /**
   * Get updated dashboard data after transaction
   */
  async getUpdatedDashboardData(connection, userId) {
    try {
      const [incomeResult] = await connection.execute(
        'SELECT COALESCE(SUM(amount), 0) as total_income FROM transactions WHERE user_id = ? AND type = "income"',
        [userId]
      );

      const [expenseResult] = await connection.execute(
        'SELECT COALESCE(SUM(amount), 0) as total_expense FROM transactions WHERE user_id = ? AND type = "expense"',
        [userId]
      );

      const [countResult] = await connection.execute(
        'SELECT COUNT(*) as transaction_count FROM transactions WHERE user_id = ?',
        [userId]
      );

      const totalIncome = parseFloat(incomeResult[0].total_income) || 0;
      const totalExpense = parseFloat(expenseResult[0].total_expense) || 0;
      const balance = totalIncome - totalExpense;
      const transactionCount = parseInt(countResult[0].transaction_count) || 0;

      return {
        totalIncome,
        totalExpense,
        balance,
        transactionCount
      };
    } catch (error) {
      console.error("Dashboard data error:", error);
      return null;
    }
  }

  /**
   * Get updated analytics data
   */
  async getUpdatedAnalytics(connection, userId) {
    try {
      // Category-wise spending
      const [categoryData] = await connection.execute(`
        SELECT category, SUM(amount) as total, COUNT(*) as count
        FROM transactions 
        WHERE user_id = ? AND type = 'expense' 
          AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
        GROUP BY category
        ORDER BY total DESC
      `, [userId]);

      // Monthly trend
      const [monthlyData] = await connection.execute(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          SUM(amount) as total_expense,
          COUNT(*) as transaction_count
        FROM transactions 
        WHERE user_id = ? AND type = 'expense'
          AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
      `, [userId]);

      return {
        topCategories: categoryData.slice(0, 5),
        monthlyTrend: monthlyData,
        totalCategories: categoryData.length
      };
    } catch (error) {
      console.error("Analytics data error:", error);
      return null;
    }
  }

  /**
   * Generate spending predictions
   */
  async generatePredictions(connection, userId) {
    try {
      // Get last 3 months data
      const [monthlyData] = await connection.execute(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          SUM(amount) as total_expense
        FROM transactions 
        WHERE user_id = ? AND type = 'expense'
          AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
      `, [userId]);

      if (monthlyData.length < 2) {
        return {
          endOfMonthPrediction: null,
          expectedSavings: null,
          projectedBudget: null,
          confidence: 'low'
        };
      }

      // Simple linear regression for prediction
      const expenses = monthlyData.map(d => parseFloat(d.total_expense));
      const averageExpense = expenses.reduce((a, b) => a + b, 0) / expenses.length;
      
      // Calculate trend
      let trend = 0;
      if (expenses.length >= 2) {
        const recent = expenses[expenses.length - 1];
        const previous = expenses[expenses.length - 2];
        trend = ((recent - previous) / previous) * 100;
      }

      // Get current month spending
      const currentMonth = new Date().toISOString().slice(0, 7);
      const [currentMonthData] = await connection.execute(`
        SELECT COALESCE(SUM(amount), 0) as current_spending
        FROM transactions 
        WHERE user_id = ? AND type = 'expense'
          AND DATE_FORMAT(created_at, '%Y-%m') = ?
      `, [userId, currentMonth]);

      const currentSpending = parseFloat(currentMonthData[0].current_spending) || 0;
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const daysPassed = new Date().getDate();
      const dailyAverage = currentSpending / daysPassed;
      const projectedEndOfMonth = dailyAverage * daysInMonth;

      return {
        endOfMonthPrediction: Math.round(projectedEndOfMonth * 100) / 100,
        averageMonthlyExpense: Math.round(averageExpense * 100) / 100,
        trendPercentage: Math.round(trend * 100) / 100,
        confidence: expenses.length >= 3 ? 'medium' : 'low'
      };
    } catch (error) {
      console.error("Prediction error:", error);
      return null;
    }
  }

  /**
   * Detect spending anomalies
   */
  async detectAnomalies(connection, userId, newAmount) {
    try {
      // Get user's spending patterns
      const [spendingData] = await connection.execute(`
        SELECT amount, category, created_at
        FROM transactions 
        WHERE user_id = ? AND type = 'expense'
          AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
        ORDER BY created_at DESC
      `, [userId]);

      if (spendingData.length < 5) {
        return {
          anomaly: false,
          reason: "Insufficient data for anomaly detection",
          severity: "low"
        };
      }

      const amounts = spendingData.map(t => parseFloat(t.amount));
      const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const standardDeviation = Math.sqrt(
        amounts.reduce((sq, n) => sq + Math.pow(n - average, 2), 0) / amounts.length
      );

      // Check for anomalies
      const threshold = 2; // 2 standard deviations
      const zScore = Math.abs((newAmount - average) / standardDeviation);

      if (zScore > threshold) {
        return {
          anomaly: true,
          reason: `Transaction amount is ${Math.round(zScore * 10) / 10}x higher than average spending`,
          severity: zScore > 3 ? "high" : "medium",
          averageSpending: Math.round(average * 100) / 100,
          zScore: Math.round(zScore * 100) / 100
        };
      }

      // Check for category spikes
      const categorySpending = {};
      spendingData.forEach(t => {
        if (!categorySpending[t.category]) {
          categorySpending[t.category] = [];
        }
        categorySpending[t.category].push(parseFloat(t.amount));
      });

      return {
        anomaly: false,
        reason: "No significant anomalies detected",
        severity: "low"
      };
    } catch (error) {
      console.error("Anomaly detection error:", error);
      return {
        anomaly: false,
        reason: "Error in anomaly detection",
        severity: "low"
      };
    }
  }

  /**
   * Generate financial insights
   */
  async generateInsights(connection, userId, extractedData) {
    try {
      const insights = [];

      // Get recent spending trends
      const [recentData] = await connection.execute(`
        SELECT 
          SUM(amount) as total,
          category,
          COUNT(*) as count
        FROM transactions 
        WHERE user_id = ? AND type = 'expense'
          AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
        GROUP BY category
        ORDER BY total DESC
      `, [userId]);

      if (recentData.length > 0) {
        const topCategory = recentData[0];
        insights.push({
          type: 'top_category',
          message: `Your highest spending category is ${topCategory.category} with ₹${topCategory.total}`,
          value: topCategory.total,
          category: topCategory.category
        });

        // Check if spending is concentrated
        const topCategoryPercentage = (topCategory.total / recentData.reduce((sum, cat) => sum + parseFloat(cat.total), 0)) * 100;
        if (topCategoryPercentage > 50) {
          insights.push({
            type: 'concentration_warning',
            message: `${Math.round(topCategoryPercentage)}% of your spending is in ${topCategory.category}`,
            value: Math.round(topCategoryPercentage),
            category: topCategory.category
          });
        }
      }

      // Add merchant-specific insight
      if (extractedData.merchant_name && extractedData.merchant_name !== 'Unknown Merchant') {
        insights.push({
          type: 'merchant_insight',
          message: `Transaction at ${extractedData.merchant_name} categorized as ${extractedData.category}`,
          merchant: extractedData.merchant_name,
          category: extractedData.category
        });
      }

      return insights;
    } catch (error) {
      console.error("Insights generation error:", error);
      return [];
    }
  }
}

module.exports = new OCREnhancedController();
