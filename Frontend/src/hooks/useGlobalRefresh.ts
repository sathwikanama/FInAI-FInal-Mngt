/**
 * Global Refresh Hook
 * Auto-refreshes all financial pages when transactions are created via OCR
 */

import { useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// Global refresh context would be ideal, but for now we'll use a simple approach
interface GlobalRefreshCallbacks {
  refreshDashboard?: () => Promise<void> | void;
  refreshExpenses?: () => Promise<void> | void;
  refreshAnalytics?: () => Promise<void> | void;
  refreshPredictions?: () => Promise<void> | void;
  refreshAnomalies?: () => Promise<void> | void;
  refreshInsights?: () => Promise<void> | void;
}

export const useGlobalRefresh = (callbacks: GlobalRefreshCallbacks = {}) => {
  const navigate = useNavigate();

  // Trigger refresh across all registered callbacks
  const refreshAllPages = useCallback(async () => {
    console.log('🔄 Global refresh triggered - updating all financial modules...');
    
    const refreshPromises = [];
    
    // Refresh each module if callback is provided
    if (callbacks.refreshDashboard) {
      refreshPromises.push(
        Promise.resolve(callbacks.refreshDashboard()).catch(err => 
          console.error('Dashboard refresh error:', err)
        )
      );
    }
    
    if (callbacks.refreshExpenses) {
      refreshPromises.push(
        Promise.resolve(callbacks.refreshExpenses()).catch(err => 
          console.error('Expenses refresh error:', err)
        )
      );
    }
    
    if (callbacks.refreshAnalytics) {
      refreshPromises.push(
        Promise.resolve(callbacks.refreshAnalytics()).catch(err => 
          console.error('Analytics refresh error:', err)
        )
      );
    }
    
    if (callbacks.refreshPredictions) {
      refreshPromises.push(
        Promise.resolve(callbacks.refreshPredictions()).catch(err => 
          console.error('Predictions refresh error:', err)
        )
      );
    }
    
    if (callbacks.refreshAnomalies) {
      refreshPromises.push(
        Promise.resolve(callbacks.refreshAnomalies()).catch(err => 
          console.error('Anomalies refresh error:', err)
        )
      );
    }
    
    if (callbacks.refreshInsights) {
      refreshPromises.push(
        Promise.resolve(callbacks.refreshInsights()).catch(err => 
          console.error('Insights refresh error:', err)
        )
      );
    }

    // Execute all refreshes in parallel
    await Promise.allSettled(refreshPromises);
    
    console.log('✅ Global refresh completed');
  }, [callbacks]);

  // Handle OCR transaction creation
  const handleOCRTransactionCreated = useCallback(async (data: any) => {
    console.log('🧾 OCR Transaction created - triggering global refresh', data);
    
    // Refresh all pages
    await refreshAllPages();
    
    // Show success notification (optional)
    if (data?.transaction) {
      console.log(`💰 Transaction ${data.transaction.id} created: ₹${data.transaction.amount} in ${data.transaction.category}`);
    }
    
    // Optionally navigate to a specific page after refresh
    // navigate('/expenses');
  }, [refreshAllPages, navigate]);

  return {
    refreshAllPages,
    handleOCRTransactionCreated
  };
};

export default useGlobalRefresh;
