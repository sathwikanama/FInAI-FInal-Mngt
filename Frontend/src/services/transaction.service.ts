const API_BASE_URL = "https://finai-final-mngt-production.up.railway.app/api";

interface CreateTransactionData {
  amount: number;
  type: "income" | "expense";
  category: string;
  description?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<ApiResponse> {
  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

const transactionService = {

  async getTransactions(queryParams: string = "") {
    // ✅ FIXED endpoint
    return apiRequest(`/transactions${queryParams}`, {
      method: "GET"
    });
  },

  async addTransaction(data: CreateTransactionData) {
    return apiRequest("/transactions", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async deleteTransaction(id: number) {
    return apiRequest(`/transactions/${id}`, {
      method: "DELETE"
    });
  }
};

export default transactionService;