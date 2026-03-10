import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  FlagIcon,
  FunnelIcon,
  ChartBarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

interface Anomaly {
  id: number;
  category: string;
  amount: number;
  created_at: string;
  reason: string;
  risk_score: number;
  status: 'pending' | 'reviewed' | 'resolved';
}

interface AnomalyData {
  totalTransactionsScanned: number;
  anomalies: Anomaly[];
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  lastScanTime: string;
}

interface FilterState {
  search: string;
  riskLevel: 'all' | 'high' | 'medium' | 'low';
  category: string;
  dateRange: '7days' | '30days' | '90days' | 'all';
}

const Anomalies: React.FC = () => {
  const [anomalyData, setAnomalyData] = useState<AnomalyData>({
  totalTransactionsScanned: 0,
  anomalies: [],
  highRiskCount: 0,
  mediumRiskCount: 0,
  lowRiskCount: 0,
  lastScanTime: ''
});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    riskLevel: 'all',
    category: 'all',
    dateRange: 'all'
  });

  useEffect(() => {
    fetchAnomalyData();
  }, []);

  const fetchAnomalyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      // Check if token exists
      if (!token) {
        console.error('No authentication token found');
        setError('Authentication required. Please log in again.');
        return;
      }
      
      const response = await axios.get('https://finai-final-mngt-production.up.railway.app/api/anomalies/test', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      if (response.data?.success && response.data?.data) {
        // Map the backend response to match frontend interface
        const backendData = response.data.data;
        const anomaliesWithRisk = (backendData.anomalies || []).map((anomaly: any) => ({
          ...anomaly,
          risk_score: anomaly.amount > 2000 ? 85 : anomaly.amount > 1000 ? 65 : 45,
          status: 'pending'
        }));
        
        setAnomalyData({
          totalTransactionsScanned: backendData.totalTransactionsChecked || 0,
          anomalies: anomaliesWithRisk,
          highRiskCount: anomaliesWithRisk.filter((a: any) => a.risk_score >= 70).length,
          mediumRiskCount: anomaliesWithRisk.filter((a: any) => a.risk_score >= 40 && a.risk_score < 70).length,
          lowRiskCount: anomaliesWithRisk.filter((a: any) => a.risk_score < 40).length,
          lastScanTime: new Date().toLocaleString()
        });
        console.log('Anomaly data loaded successfully:', response.data);
      } else {
        console.log('No data received from API');
        setError('No anomaly data available');
      }
    } catch (err: any) {
      console.error('Error fetching anomaly data:', err);
      
      // Provide more specific error messages based on error type
      if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') {
        setError('Cannot connect to the server. Please check if the backend is running on localhost:5001');
      } else if (err.code === 'ECONNREFUSED') {
        setError('Server is not running. Please start the backend server first.');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 404) {
        setError('Anomaly detection API not found. Please check backend routes.');
      } else {
        setError(`Failed to load anomaly data: ${err.message || 'Unknown error'}`);
      }
      
      // Set fallback mock data if server is unreachable
      if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
        console.log('Using fallback mock data due to server unavailability');
        setAnomalyData({
          totalTransactionsScanned: 154,
          anomalies: [
            {
              id: 1,
              category: 'Food & Dining',
              amount: 2500,
              created_at: '2026-03-05T18:53:48.000Z',
              reason: 'Unusually high food expense detected',
              risk_score: 85,
              status: 'pending'
            },
            {
              id: 2,
              category: 'Shopping',
              amount: 1800,
              created_at: '2026-03-04T14:22:15.000Z',
              reason: 'Unusual shopping expense detected',
              risk_score: 65,
              status: 'pending'
            },
            {
              id: 3,
              category: 'Transport',
              amount: 500,
              created_at: '2026-03-03T09:15:30.000Z',
              reason: 'Unusual transport expense detected',
              risk_score: 45,
              status: 'reviewed'
            }
          ],
          highRiskCount: 1,
          mediumRiskCount: 1,
          lowRiskCount: 1,
          lastScanTime: new Date().toLocaleString()
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskBadgeText = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Unknown';
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredAnomalies = (anomalyData?.anomalies || []).filter(anomaly => {
    if (filters.search && !anomaly.category.toLowerCase().includes(filters.search.toLowerCase()) && 
        !anomaly.reason.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    if (filters.riskLevel !== 'all') {
      const riskScore = anomaly.risk_score;
      if (filters.riskLevel === 'high' && riskScore < 70) return false;
      if (filters.riskLevel === 'medium' && (riskScore < 40 || riskScore >= 70)) return false;
      if (filters.riskLevel === 'low' && riskScore >= 40) return false;
    }
    
    if (filters.category !== 'all' && anomaly.category !== filters.category) {
      return false;
    }
    
    return true;
  }) || [];

  const getAnomalyStats = () => {
    if (!anomalyData?.anomalies) return { high: 0, medium: 0, low: 0 };
    
    return {
      high: anomalyData.anomalies.filter(a => a.risk_score >= 70).length,
      medium: anomalyData.anomalies.filter(a => a.risk_score >= 40 && a.risk_score < 70).length,
      low: anomalyData.anomalies.filter(a => a.risk_score < 40).length
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Analyzing transactions for anomalies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-red-600 mb-2">Connection Error</p>
          <p className="text-gray-600 mb-6">{error}</p>
          
          {/* Additional help for common issues */}
          {(error.includes('server') || error.includes('backend')) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-blue-800 mb-2">How to fix this issue:</h3>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Make sure the backend server is running on localhost:5001</li>
                <li>2. Open a terminal and navigate to the Backend folder</li>
                <li>3. Run: <code className="bg-blue-100 px-2 py-1 rounded">npm start</code></li>
                <li>4. Wait for "Server running on port 5001" message</li>
                <li>5. Refresh this page</li>
              </ol>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={fetchAnomalyData}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry Connection
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = getAnomalyStats();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Anomaly Detection</h1>
          <p className="text-gray-600">AI-powered monitoring of unusual spending patterns</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Transactions Scanned */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900">{anomalyData.totalTransactionsScanned.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Transactions Scanned</p>
            </div>
          </div>

          {/* High Risk Count */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-full">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-red-600">{stats.high.toLocaleString()}</p>
              <p className="text-sm text-red-500">High Risk Anomalies</p>
            </div>
          </div>

          {/* Medium Risk Count */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-yellow-600">{stats.medium.toLocaleString()}</p>
              <p className="text-sm text-yellow-500">Medium Risk Anomalies</p>
            </div>
          </div>

          {/* Low Risk Count */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-green-600">{stats.low.toLocaleString()}</p>
              <p className="text-sm text-green-500">Low Risk Anomalies</p>
            </div>
          </div>

          {/* Last Scan Time */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:col-span-2">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <ArrowPathIcon className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-lg text-gray-900">{anomalyData.lastScanTime}</p>
              <p className="text-sm text-gray-500">Last Scan Time</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button
              onClick={() => setFilters({ search: '', riskLevel: 'all', category: 'all', dateRange: 'all' })}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Transactions</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search by description or reason..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Risk Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
              <select
                value={filters.riskLevel}
                onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value as any }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Risk Levels</option>
                <option value="high">High Risk Only</option>
                <option value="medium">Medium Risk Only</option>
                <option value="low">Low Risk Only</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="Food & Dining">Food & Dining</option>
                <option value="Shopping">Shopping</option>
                <option value="Transport">Transport</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Bills">Bills</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Anomalies Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Detected Anomalies</h2>
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                Showing {filteredAnomalies.length} of {anomalyData?.anomalies.length || 0} anomalies
              </span>
            </div>
          </div>

          {filteredAnomalies.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Anomalies Detected</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                No anomalies detected. Your spending looks normal.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Risk Score</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnomalies.map((anomaly) => (
                    <tr key={anomaly.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">{formatDate(anomaly.created_at)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{anomaly.reason}</p>
                          <p className="text-xs text-gray-500">Unusual {anomaly.category} Transaction</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900">{formatCurrency(anomaly.amount)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">{anomaly.category}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskBadgeColor(anomaly.risk_score >= 70 ? 'high' : anomaly.risk_score >= 40 ? 'medium' : 'low')}`}>
                            {getRiskBadgeText(anomaly.risk_score >= 70 ? 'high' : anomaly.risk_score >= 40 ? 'medium' : 'low')}
                          </span>
                          <span className="text-sm text-gray-600">({anomaly.risk_score})</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            anomaly.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            anomaly.status === 'reviewed' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {anomaly.status === 'resolved' ? 'Resolved' : anomaly.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              console.log('View transaction:', anomaly);
                            }}
                            className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
                            title="View transaction details"
                          >
                            <EyeIcon className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => {
                              console.log('Mark as reviewed:', anomaly);
                            }}
                            className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
                            title="Mark as reviewed"
                          >
                            <FlagIcon className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => {
                              console.log('Ignore anomaly:', anomaly);
                            }}
                            className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
                            title="Ignore this anomaly"
                          >
                            <XCircleIcon className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Chart Section */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Anomalies by Category</h2>
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {['Food & Dining', 'Shopping', 'Transport', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Other'].map(category => {
                const count = (anomalyData?.anomalies || []).filter(a => a.category === category).length;
                const percentage = (anomalyData?.anomalies || []).length > 0 ? (count / (anomalyData?.anomalies || []).length * 100) : 0;
                
                return (
                  <div key={category} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{category}</span>
                      <span className="text-sm text-gray-500">{count} anomalies</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Anomalies;
