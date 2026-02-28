import React, { useState, useEffect } from 'react';
import api from "../api/axios";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  net: number;
}

interface CategoryData {
  category: string;
  total: number;
}

interface AnalyticsData {
  monthly: MonthlyData[];
  categories: CategoryData[];
}

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

 useEffect(() => {
  const fetchAnalytics = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");

      if (!user?.id) {
        setError("User not found. Please login again.");
        setLoading(false);
        return;
      }

      const response = await api.get(
        `/api/analytics/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      setAnalytics(response.data.data);

    } catch (err: any) {
      setError(err?.message || "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  fetchAnalytics();
}, []);

  const getCategoryColors = (index: number) => {
    const colors = ['#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#EC4899', '#14B8A6', '#F97316'];
    return colors[index % colors.length];
  };

  // ===== UI STATES =====
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-lg font-semibold">
        Loading analytics...
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  if (!analytics) {
    return <div className="p-6">No analytics data found.</div>;
  }

  // ===== DATA =====
  const monthlyData = analytics.monthly || [];
  const categoryData = analytics.categories || [];

  const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
  const totalExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0);
  const netSavings = totalIncome - totalExpense;

  const savingsRate =
    totalIncome > 0 ? parseFloat(((netSavings / totalIncome) * 100).toFixed(2)) : 0;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">

      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Financial Analytics
      </h1>

      {/* ==== CARDS ==== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-500">Total Income</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            ₹{totalIncome.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-500">Total Expense</p>
          <p className="text-2xl font-bold text-red-500 mt-2">
            ₹{totalExpense.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-500">Net Savings</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            ₹{netSavings.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-500">Savings Rate</p>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {savingsRate}%
          </p>
        </div>
      </div>

      {/* ==== BAR CHART ==== */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-10">
        <h2 className="text-lg font-semibold mb-6">Income vs Expenses</h2>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
              <Legend />
              <Bar dataKey="income" fill="#10B981" />
              <Bar dataKey="expense" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ==== PIE ==== */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold mb-6">
          Expense Distribution by Category
        </h2>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="total"
                nameKey="category"
                outerRadius={100}
                label
              >
                {categoryData.map((entry, index) => (
                  <Cell key={index} fill={getCategoryColors(index)} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default Analytics;