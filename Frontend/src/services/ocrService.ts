import api from './api';

export interface ScanResult {
  amount: number;
}

export const ocrService = {
  // POST scan single receipt
  scanReceipt: async (file: File) => {
    console.log('🔍 Starting OCR scan for file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    const formData = new FormData();
    formData.append('receipt', file);
    
    try {
      console.log('📤 Sending request to: http://localhost:5001/api/ocr/scan');
      console.log('📋 FormData contents:');
      formData.forEach((value, key) => {
        console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
      });
      
      const response = await api.post('/ocr/scan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout
      });
      
      console.log('✅ OCR scan response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ OCR scan error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      // Re-throw with more context
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 413) {
        throw new Error('File too large. Please upload an image smaller than 5MB.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid file format or request');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. OCR processing took too long.');
      } else {
        throw new Error(`Failed to process receipt: ${error.message}`);
      }
    }
  },

  // GET scan history
  getHistory: async () => {
    try {
      const response = await api.get('/ocr/history');
      console.log('✅ OCR history response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ OCR history error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      // Re-throw with more context
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error(`Failed to retrieve OCR history: ${error.message}`);
      }
    }
  },
};

export default ocrService;