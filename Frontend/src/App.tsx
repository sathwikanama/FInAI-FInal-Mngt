import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Analytics from './pages/Analytics';
import Predictions from './pages/Predictions';
import Anomalies from './pages/Anomalies';
import ReceiptScanner from './pages/ReceiptScanner';
import ReceiptHistory from './pages/ReceiptHistory';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import HelpSupport from './pages/HelpSupport';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="predictions" element={<Predictions />} />
            <Route path="anomalies" element={<Anomalies />} />
            <Route path="scan" element={<ReceiptScanner />} />
            <Route path="receipt-history" element={<ReceiptHistory />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="help" element={<HelpSupport />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
