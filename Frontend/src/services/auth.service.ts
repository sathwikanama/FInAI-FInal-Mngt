const API_BASE_URL = "https://finai-final-mngt-production.up.railway.app/api";

interface User {
  id: number;
  email: string;
  createdAt: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  data?: {
    user?: User;
  };
}

interface ProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  } | null;
}

// Store and retrieve token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('authToken');
};

const setToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

const removeToken = (): void => {
  localStorage.removeItem('authToken');
};

// API helper with automatic token attachment
const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers,
  };

  return fetch(url, config);
};

// Auth service functions
export const authService = {
  // Signup new user
  async signup(email: string, password: string): Promise<AuthResponse> {
    const response = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    return data;
  },

  // Login user and store token
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const data: AuthResponse = await response.json();
    
    // Store token if login successful
    if (data.success && data.token) {
      setToken(data.token);
    }

    return data;
  },

  // Logout user and remove token
  async logout(): Promise<AuthResponse> {
    const response = await apiRequest('/auth/logout', {
      method: 'POST',
    });

    const data = await response.json();
    
    // Remove token from localStorage
    removeToken();

    return data;
  },

  // Get user profile (protected route)
  async getProfile(): Promise<ProfileResponse> {
    const response = await apiRequest('/profile', {
      method: 'GET',
    });

    const data = await response.json();
    return data;
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!getToken();
  },

  // Get stored token
  getToken(): string | null {
    return getToken();
  },
};

export default authService;
