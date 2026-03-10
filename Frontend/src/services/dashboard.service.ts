const API_BASE_URL = "https://finai-final-mngt-production.up.railway.app/api";

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  return response.json();
}

export const dashboardService = {
  async getDashboardData(month?: string | null, year?: string | null) {
    let endpoint = "/dashboard";
    
    if (month && year) {
      endpoint += `?month=${month}&year=${year}`;
    }
    
    return apiRequest(endpoint, { method: "GET" });
  }
};

export default dashboardService;