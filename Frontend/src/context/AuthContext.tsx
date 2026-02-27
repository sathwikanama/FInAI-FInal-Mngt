import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import authService from '../services/auth.service';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  studentId?: string;
  institution?: string;
  course?: string;
  year?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signup: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 Check auth on app start
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken) {
        setToken(storedToken);
      }

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  // ✅ LOGIN FIXED
const login = async (email: string, password: string) => {
  try {
    const response = await fetch("http://localhost:5001/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {

      // ✅ Save to localStorage
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      // ✅ IMPORTANT: update React state
      setUser(data.data.user);
      setToken(data.data.token);

      return { success: true, message: "Login successful" };
    }

    return { success: false, message: data.message };

  } catch (err) {
    console.error("Login error:", err);
    return { success: false, message: "Server error" };
  }
};



  const signup = async (email: string, password: string) => {
    try {
      const response = await authService.signup(email, password);
      return { success: response.success, message: response.message };
    } catch {
      return { success: false, message: "Signup failed" };
    }
  };

  const logout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setToken(null);

    return { success: true, message: "Logged out" };
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};

export default AuthContext;
