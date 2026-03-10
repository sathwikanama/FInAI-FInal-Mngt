import React, { useState, useEffect } from 'react';
import { 
  LightBulbIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import useRefreshData from '../hooks/useRefreshData';

interface Recommendations {
  predictedExpense: number;
  confidence: string;
  budgetSuggestion: string | null;
  alertSuggestion: string | null;
  savingsSuggestion: string | null;
  trendInsight: string | null;
}

const Recommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { registerRefreshCallbacks } = useRefreshData();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        const response = await axios.get('https://finai-final-mngt-production.up.railway.app/api/recommendations/test', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success && response.data.data) {
          setRecommendations(response.data.data);
        }
      } catch (err: any) {
        console.error('Error fetching recommendations:', err);
        setError('Failed to load AI recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  useEffect(() => {
    // Register refresh callback for recommendations data
    registerRefreshCallbacks({
      refreshRecommendations: async () => {
        try {
          setLoading(true);
          setError(null);
          
          const token = localStorage.getItem('token');
          const response = await axios.get('https://finai-final-mngt-production.up.railway.app/api/recommendations/test', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.data.success && response.data.data) {
            setRecommendations(response.data.data);
          }
        } catch (err: any) {
          console.error('Error fetching recommendations:', err);
          setError('Failed to load AI recommendations');
        } finally {
          setLoading(false);
        }
      }
    });
  }, [registerRefreshCallbacks]);

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const getConfidenceColor = (confidence: string) => {
    switch(confidence) {
      case 'High': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Generating AI Insights...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">No recommendations available</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">AI Recommendations</h1>
          <p className="text-gray-600">Personalized insights based on your spending patterns</p>
        </div>
        <div className="flex items-center space-x-2">
          <LightBulbIcon className="h-5 w-5 text-yellow-500" />
          <span className={`text-sm font-medium ${getConfidenceColor(recommendations.confidence)}`}>
            {recommendations.confidence} Confidence
          </span>
        </div>
      </div>

      {/* Predicted Expense Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Next Month Prediction</h2>
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-sm text-gray-500">Predicted Expense</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(recommendations.predictedExpense)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Confidence</p>
                <p className={`text-xl font-bold ${getConfidenceColor(recommendations.confidence)}`}>
                  {recommendations.confidence}
                </p>
              </div>
            </div>
          </div>
          <div className="p-3 bg-blue-100 rounded-lg">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Recommendations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Budget Suggestion */}
        {recommendations.budgetSuggestion && (
          <div className="bg-white shadow rounded-xl p-6 border-l-4 border-blue-500">
            <div className="flex items-start">
              <div className="p-2 bg-blue-100 rounded-lg mr-4">
                <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-2">Budget Adjustment</h3>
                <p className="text-gray-600">{recommendations.budgetSuggestion}</p>
              </div>
            </div>
          </div>
        )}

        {/* Alert Suggestion */}
        {recommendations.alertSuggestion && (
          <div className="bg-white shadow rounded-xl p-6 border-l-4 border-yellow-500">
            <div className="flex items-start">
              <div className="p-2 bg-yellow-100 rounded-lg mr-4">
                <ExclamationCircleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-2">Alert Threshold</h3>
                <p className="text-gray-600">{recommendations.alertSuggestion}</p>
              </div>
            </div>
          </div>
        )}

        {/* Savings Suggestion */}
        {recommendations.savingsSuggestion && (
          <div className="bg-white shadow rounded-xl p-6 border-l-4 border-green-500">
            <div className="flex items-start">
              <div className="p-2 bg-green-100 rounded-lg mr-4">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-2">Savings Opportunity</h3>
                <p className="text-gray-600">{recommendations.savingsSuggestion}</p>
              </div>
            </div>
          </div>
        )}

        {/* Trend Insight */}
        {recommendations.trendInsight && (
          <div className="bg-white shadow rounded-xl p-6 border-l-4 border-purple-500">
            <div className="flex items-start">
              <div className="p-2 bg-purple-100 rounded-lg mr-4">
                {recommendations.trendInsight.includes('increasing') ? (
                  <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600" />
                ) : (
                  <ArrowTrendingDownIcon className="h-6 w-6 text-purple-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-2">Trend Analysis</h3>
                <p className="text-gray-600">{recommendations.trendInsight}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto"
        >
          <ArrowPathIcon className="h-5 w-5 mr-2" />
          Refresh Recommendations
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Recommendations update automatically when you refresh the page
        </p>
      </div>
    </div>
  );
};

export default Recommendations;
