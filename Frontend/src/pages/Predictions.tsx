import React, { useState, useEffect } from 'react';
import {
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import useRefreshData from '../hooks/useRefreshData';
import PredictionChart from '../components/PredictionChart';

interface HistoricalData {
  month: string;
  amount: number;
}

interface PredictionType {
  predictedExpense: number;
  slope: number;
  confidence: string;
  monthsAnalyzed: number;
  r2Score: number;
  historicalData: HistoricalData[];
  riskStatus: string;
  spendingRatio: number;
}

const Predictions: React.FC = () => {
  const [predictionData, setPredictionData] = useState<PredictionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { registerRefreshCallbacks } = useRefreshData();

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/predictions/test', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success && response.data.data) {
        setPredictionData(response.data.data);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load AI predictions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  useEffect(() => {
    registerRefreshCallbacks({
      refreshPredictions: fetchPredictions
    });
  }, [registerRefreshCallbacks]);

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString('en-IN')}`;

  const getTrendText = (slope: number) => {
    if (slope > 0) return 'Increasing';
    if (slope < 0) return 'Decreasing';
    return 'Stable';
  };

  const getTrendColor = (slope: number) => {
    if (slope > 0) return 'text-green-600';
    if (slope < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getConfidenceWidth = () =>
    `${Math.round((predictionData?.r2Score || 0) * 100)}%`;

  const getRiskColor = (risk: string) => {
    if (risk === "Low") return "text-green-600";
    if (risk === "Moderate") return "text-yellow-600";
    return "text-red-600";
  };

  if (loading)
    return <div className="flex items-center justify-center h-64 text-lg text-gray-600">
      Loading predictions...
    </div>;

  if (error)
    return <div className="flex items-center justify-center h-64 text-lg text-red-600">
      {error}
    </div>;

  if (!predictionData)
    return <div className="flex items-center justify-center h-64 text-lg text-gray-600">
      No prediction data available
    </div>;

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Expense Predictions
          </h1>
          <p className="text-gray-500">
            AI-powered insights into your future spending
          </p>
        </div>

        <button
          onClick={fetchPredictions}
          className="px-4 py-2 border rounded-lg hover:bg-gray-100 flex items-center"
        >
          <ArrowPathIcon className="h-5 w-5 mr-2" />
          Refresh
        </button>
      </div>

      {/* TOP CARDS (NOW 4 CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Predicted Expense */}
        <div className="card p-6 text-center">
          <p className="text-sm text-gray-500">Predicted Expense</p>
          <p className="text-2xl font-bold mt-3">
            {formatCurrency(predictionData.predictedExpense)}
          </p>
        </div>

        {/* Prediction Confidence */}
        <div className="card p-6 text-center">
          <p className="text-sm text-gray-500">Prediction Confidence</p>
          <p className="text-2xl font-bold mt-3">
            {predictionData.confidence}
          </p>
          <div className="flex justify-center mt-2">
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: getConfidenceWidth() }}
              />
            </div>
          </div>
        </div>

        {/* Spending Trend */}
        <div className="card p-6 text-center">
          <p className="text-sm text-gray-500">Spending Trend</p>
          <p className={`text-2xl font-bold mt-3 ${getTrendColor(predictionData.slope)}`}>
            {getTrendText(predictionData.slope)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Monthly Change: ₹{Math.abs(predictionData.slope).toLocaleString('en-IN')}
          </p>
        </div>

        {/* Next Month Risk */}
        <div className="card p-6 text-center">
          <p className="text-sm text-gray-500">Next Month Risk</p>
          <p className={`text-2xl font-bold mt-3 ${getRiskColor(predictionData.riskStatus)}`}>
            {predictionData.riskStatus}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Expected to use {predictionData.spendingRatio}% of income
          </p>
        </div>

      </div>

      {/* CHART */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">
          Monthly Expense Trend
        </h2>
        <PredictionChart
          historicalData={predictionData.historicalData}
          predictedValue={predictionData.predictedExpense}
        />
      </div>

      {/* SMART EXPLANATION SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">
          How This Prediction Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">Data Analyzed</p>
            <p className="text-lg font-semibold text-gray-800 mt-2">
              {predictionData.monthsAnalyzed} Months of Spending
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Based on your past transaction patterns
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">Prediction Method</p>
            <p className="text-lg font-semibold text-gray-800 mt-2">
              Trend-Based Analysis
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Detects consistent increases or decreases
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">Prediction Confidence</p>
            <p className="text-lg font-semibold text-gray-800 mt-2">
              {Math.round(predictionData.r2Score * 100)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Higher value means more reliable trend
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Predictions;