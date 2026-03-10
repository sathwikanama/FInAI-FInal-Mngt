import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://finai-final-mngt-production.up.railway.app/api';

const insightsService = {
  getInsights: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/insights`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Insights API error:', error);
      throw error;
    }
  }
};

export default insightsService;
