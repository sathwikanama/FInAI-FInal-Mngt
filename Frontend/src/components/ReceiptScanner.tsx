/**
 * Production Receipt Scanner Component
 * Clean UI without debug text, with all receipt history fixes
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  CameraIcon,
  PhotoIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

interface ReceiptScannerProps {
  className?: string;
}

// Category icons mapping
const categoryIcons: Record<string, string> = {
  'Food': '🍔',
  'Shopping': '🛍️',
  'Groceries': '🛒',
  'Transport': '🚗',
  'Education': '📚',
  'Bills': '📄',
  'Entertainment': '🎬',
  'Healthcare': '🏥',
  'Travel': '✈️',
  'Other': '📋'
};

const categories = ['Food', 'Shopping', 'Groceries', 'Transport', 'Education', 'Bills', 'Entertainment', 'Healthcare', 'Travel', 'Other'];

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ className = '' }) => {
  const [receiptHistory, setReceiptHistory] = useState<any[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [transactionData, setTransactionData] = useState({
    amount: '',
    category: 'Other',
    description: '',
    merchant_name: '',
    payment_method: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch receipt history with cache busting
  const fetchReceiptHistory = useCallback(async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.log("No token found, skipping history fetch");
        return;
      }

      // Add cache busting to prevent cached responses
      const timestamp = Date.now();
      const response = await fetch(`http://localhost:5001/api/transactions?limit=10&_t=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        // Sort by date descending (newest first)
        const sortedHistory = data.data.sort((a: any, b: any) => 
          new Date(b.created_at || b.transaction_date).getTime() - 
          new Date(a.created_at || a.transaction_date).getTime()
        );
        setReceiptHistory(sortedHistory);
        console.log('Receipt history loaded and sorted:', sortedHistory.length, 'items');
      } else {
        console.log('No receipt history data available');
        setReceiptHistory([]);
      }
    } catch (error) {
      console.error('Failed to fetch receipt history:', error);
      setReceiptHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load history when component mounts
  useEffect(() => {
    console.log('Component mounted, fetching receipt history...');
    fetchReceiptHistory();
  }, [fetchReceiptHistory]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  }, []);

  const processFile = async (file: File) => {
    setError(null);
    setSuccess(null);
    setScanResult(null);
    setImageLoaded(false);
    
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage(result);
      setUploadedFile(file);
      setTimeout(() => setImageLoaded(true), 100);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  // Camera functions
  const startCamera = async () => {
    try {
      console.log('Starting camera...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      setCameraStream(stream);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('Camera stream attached to video element');
        }
      }, 100);
      
      setShowCameraModal(true);
    } catch (error) {
      console.error('Camera error:', error);
      setError('Camera access denied or not available');
    }
  };

  const stopCamera = () => {
    console.log('Stopping camera...');
    
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    console.log('Capturing photo...');
    
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        console.error('Cannot get canvas context');
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          console.log('Photo captured, processing file...');
          processFile(file);
          stopCamera();
        } else {
          console.error('Failed to create blob from canvas');
          setError('Failed to capture photo');
        }
      }, 'image/jpeg', 0.95);
    } else {
      console.error('Video or canvas ref not available');
      setError('Camera not ready');
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    setScanResult(null);
    setError(null);
    setSuccess(null);
    setImageLoaded(false);
  };

  // OCR processing
  const scanReceipt = async () => {
    if (!uploadedFile) {
      setError('No receipt to scan');
      return;
    }

    console.log('Starting OCR scan...');
    setScanning(true);
    setScanProgress(0);
    setError(null);
    setSuccess(null);

    try {
      const progressInterval = setInterval(() => {
        setScanProgress(prev => {
          const newProgress = Math.min(prev + 10, 90);
          console.log('Scan progress:', newProgress + '%');
          return newProgress;
        });
      }, 300);

      const formData = new FormData();
      formData.append('receipt', uploadedFile);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/ocr/scan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setScanProgress(100);

      if (!response.ok) {
        throw new Error(`OCR service error: ${response.status}`);
      }

      const result = await response.json();
      console.log('OCR result:', result);

      if (result.success) {
        setScanResult(result);
        setTransactionData({
          amount: result.amount?.toString() || '',
          category: result.category || 'Other',
          description: `OCR: ${result.merchant_name || 'Receipt'}`,
          merchant_name: result.merchant_name || '',
          payment_method: result.payment_method || '',
          date: new Date().toISOString().split('T')[0]
        });
        setSuccess('Receipt scanned successfully!');
      } else {
        setError(result.message || 'OCR processing failed');
      }
    } catch (error: any) {
      console.error('OCR scan error:', error);
      setError(error.message || 'Failed to process receipt');
    } finally {
      setScanning(false);
      setTimeout(() => setScanProgress(0), 1000);
    }
  };

  // Save transaction with instant history update
  const saveTransaction = async () => {
    if (!scanResult) {
      setError('No scan result to save');
      return;
    }

    console.log('Starting save transaction...');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const transactionPayload = {
        amount: parseFloat(transactionData.amount) || 0,
        type: 'expense',
        category: transactionData.category,
        description: transactionData.description,
        merchant_name: transactionData.merchant_name,
        payment_method: transactionData.payment_method,
        transaction_date: transactionData.date
      };

      console.log('Transaction payload:', transactionPayload);

      const response = await fetch('http://localhost:5001/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(transactionPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Save error: ${response.status}`);
      }

      const newTransaction = await response.json();
      console.log('Saved transaction:', newTransaction);
      
      if (newTransaction.success && newTransaction.data) {
        setSuccess('Transaction added successfully');
        
        // Instant UI update - Add new transaction to state immediately
        console.log('Adding new transaction to history instantly...');
        
        setReceiptHistory((prev) => {
          const updatedHistory = [newTransaction.data, ...prev];
          console.log('Updated receipt history:', updatedHistory);
          return updatedHistory.slice(0, 10); // Keep only last 10
        });
        
        // Also refresh from server to ensure consistency
        setTimeout(() => {
          console.log('Refreshing from server...');
          fetchReceiptHistory();
        }, 1000);
        
        setTimeout(() => {
          removeImage();
        }, 2000);
      } else {
        setError(newTransaction.message || 'Failed to save transaction');
      }
    } catch (error: any) {
      console.error('Save transaction error:', error);
      setError(error.message || 'Failed to save transaction');
    }
  };

  const uploadAnother = () => {
    removeImage();
    setScanResult(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className={`min-h-screen bg-gray-50 py-8 px-4 ${className}`}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Receipt Scanner</h1>
          <p className="text-lg text-gray-600">Upload or scan your receipt to automatically create a transaction.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scanner Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Scanner Card */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              {!uploadedImage ? (
                // Upload Area
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                    dragOver 
                      ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
                      : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drag & Drop your receipt here
                  </p>
                  <p className="text-sm text-gray-500 mb-6">or</p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center text-lg font-medium"
                    >
                      <PhotoIcon className="h-5 w-5 mr-2" />
                      Upload Receipt
                    </button>
                    
                    <button
                      onClick={startCamera}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center text-lg font-medium"
                    >
                      <CameraIcon className="h-5 w-5 mr-2" />
                      Take Photo
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-4">
                    Supported formats: JPG, PNG, PDF (Max 5MB)
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                // Image Preview and Actions
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className={`relative transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
                      <img
                        src={uploadedImage || ''}
                        alt="Receipt preview"
                        className="w-full rounded-lg border border-gray-300 mx-auto"
                        style={{ 
                          maxHeight: '220px', 
                          objectFit: 'contain',
                          display: 'block'
                        }}
                        onLoad={() => setImageLoaded(true)}
                      />
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600 text-center">
                      {uploadedFile?.name} • {Math.round((uploadedFile?.size || 0) / 1024)} KB
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      onClick={scanReceipt}
                      disabled={scanning}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 flex items-center justify-center text-sm font-medium"
                    >
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      Scan Receipt
                    </button>
                    
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center text-sm font-medium"
                    >
                      <CameraIcon className="h-4 w-4 mr-2" />
                      Retake Photo
                    </button>
                    
                    <button
                      onClick={uploadAnother}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center text-sm font-medium"
                    >
                      <ArrowPathIcon className="h-4 w-4 mr-2" />
                      Upload Another
                    </button>
                    
                    <button
                      onClick={removeImage}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center text-sm font-medium"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </div>

                  {scanning && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-center mb-3">
                        <p className="text-sm font-medium text-blue-900">Scanning Receipt...</p>
                        <p className="text-xs text-blue-700 mt-1">
                          {scanProgress < 25 && 'Extracting Text...'}
                          {scanProgress >= 25 && scanProgress < 50 && 'Detecting Merchant...'}
                          {scanProgress >= 50 && scanProgress < 75 && 'Analyzing Amount...'}
                          {scanProgress >= 75 && 'Finalizing Results...'}
                        </p>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-600 to-blue-700 h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>
                      <div className="text-center mt-2">
                        <span className="text-sm font-bold text-blue-600">{scanProgress}%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Results Card */}
            {scanResult && (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Extracted Transaction Details</h3>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-green-600 font-medium">Successfully Extracted</span>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">OCR Confidence</span>
                    <span className="text-sm font-bold text-green-600">{scanResult.confidence || 85}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${scanResult.confidence || 85}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Merchant Name</label>
                    <input
                      type="text"
                      value={transactionData.merchant_name}
                      onChange={(e) => setTransactionData({...transactionData, merchant_name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Merchant name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={transactionData.amount}
                      onChange={(e) => setTransactionData({...transactionData, amount: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={transactionData.category}
                      onChange={(e) => setTransactionData({...transactionData, category: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {categoryIcons[cat]} {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={transactionData.date}
                      onChange={(e) => setTransactionData({...transactionData, date: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <input
                      type="text"
                      value={transactionData.payment_method}
                      onChange={(e) => setTransactionData({...transactionData, payment_method: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Cash, Card, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <input
                      type="text"
                      value={transactionData.description}
                      onChange={(e) => setTransactionData({...transactionData, description: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Transaction description"
                    />
                  </div>
                </div>

                <div className="border-t pt-4 mb-6">
                  <button
                    onClick={() => setShowRawText(!showRawText)}
                    className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <span>View Raw OCR Text</span>
                    {showRawText ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                  </button>
                  {showRawText && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                        {scanResult.raw_text || 'No raw text available'}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={saveTransaction}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 font-medium"
                  >
                    Save Transaction
                  </button>
                  <button
                    onClick={uploadAnother}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 font-medium"
                  >
                    Upload Another
                  </button>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">Success!</h3>
                    <p className="text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-900">Error</h3>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Receipt History */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Receipt History</h3>
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {receiptHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">No receipts scanned yet</p>
                    <p className="text-gray-400 text-xs mt-2">Upload and scan your first receipt to get started</p>
                  </div>
                ) : (
                  receiptHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.merchant_name || 'Receipt'}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(item.created_at || item.transaction_date).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-gray-900">₹{item.amount}</p>
                        <p className="text-xs text-gray-400">{item.category || 'Other'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Capture Receipt</h3>
                <button
                  onClick={stopCamera}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="relative mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg border border-gray-300"
                  style={{ 
                    height: '300px',
                    objectFit: 'cover'
                  }}
                />
                {!cameraStream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                    <p className="text-gray-500">Initializing camera...</p>
                  </div>
                )}
              </div>
              
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="flex gap-3">
                <button
                  onClick={capturePhoto}
                  disabled={!cameraStream}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Capture Photo
                </button>
                <button
                  onClick={stopCamera}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptScanner;
