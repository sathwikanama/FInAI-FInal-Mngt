/**
 * New Receipt Scanner Component
 * Clean, minimal, professional fintech-style UI
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  CameraIcon,
  PhotoIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import ocrService from '../services/ocrService';

interface NewReceiptScannerProps {
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

const NewReceiptScanner: React.FC<NewReceiptScannerProps> = ({ className = '' }) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [transactionData, setTransactionData] = useState({
    amount: '',
    category: 'Other',
    description: '',
    merchant_name: '',
    payment_method: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);

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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (error) {
      setError('Camera access denied or not available');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          processFile(file);
          stopCamera();
        }
      });
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

  const scanReceipt = async () => {
    if (!uploadedFile) return;

    setScanning(true);
    setScanProgress(0);
    setError(null);
    setSuccess(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setScanProgress(prev => Math.min(prev + 15, 90));
      }, 300);

      const result = await ocrService.scanReceipt(uploadedFile);
      
      clearInterval(progressInterval);
      setScanProgress(100);

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
      setError(error.message || 'Failed to process receipt');
    } finally {
      setScanning(false);
      setTimeout(() => setScanProgress(0), 1000);
    }
  };

  const saveTransaction = async () => {
    if (!scanResult) return;

    try {
      const response = await fetch('http://localhost:5001/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: parseFloat(transactionData.amount),
          type: 'expense',
          category: transactionData.category,
          description: transactionData.description,
          merchant_name: transactionData.merchant_name,
          payment_method: transactionData.payment_method,
          transaction_date: transactionData.date
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setSuccess('Transaction added successfully.');
        setTimeout(() => {
          removeImage();
        }, 2000);
      } else {
        setError(result.message || 'Failed to save transaction');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to save transaction');
    }
  };

  const scanAnotherReceipt = () => {
    removeImage();
    setScanResult(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className={`min-h-screen bg-gray-50 py-8 px-4 ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Receipt Scanner</h1>
        <p className="text-lg text-gray-600">Upload or scan your receipt to automatically create a transaction.</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Scanner Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {!uploadedImage && !showCamera ? (
            // Upload Area
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                dragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <CloudArrowUpIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-xl font-medium text-gray-900 mb-2">
                Drag receipt here or upload
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center"
                >
                  <PhotoIcon className="h-5 w-5 mr-2" />
                  Choose File
                </button>
                
                <button
                  onClick={startCamera}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 flex items-center justify-center"
                >
                  <CameraIcon className="h-5 w-5 mr-2" />
                  Take Photo
                </button>
              </div>
              
              <p className="text-sm text-gray-500 mt-4">
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
          ) : showCamera ? (
            // Camera View
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                />
                <button
                  onClick={stopCamera}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={capturePhoto}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300"
                >
                  Capture Photo
                </button>
              </div>
            </div>
          ) : (
            // Image Preview
            <div className="space-y-4">
              <div className={`relative transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
                <img
                  src={uploadedImage || ''}
                  alt="Receipt preview"
                  className="w-full rounded-lg"
                  onLoad={() => setImageLoaded(true)}
                />
              </div>
              
              <div className="text-sm text-gray-600 text-center">
                {uploadedFile?.name} • {Math.round((uploadedFile?.size || 0) / 1024)} KB
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 flex items-center justify-center"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Replace Image
                </button>
                <button
                  onClick={removeImage}
                  className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-300 flex items-center justify-center"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Remove Image
                </button>
              </div>

              {/* Scan Button */}
              <button
                onClick={scanReceipt}
                disabled={scanning}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center text-lg font-medium"
              >
                {scanning ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                    Processing...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-6 w-6 mr-3" />
                    Scan Receipt
                  </>
                )}
              </button>

              {/* Scanning Progress */}
              {scanning && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-center mb-3">
                    <p className="text-sm font-medium text-blue-900">Scanning Receipt...</p>
                    <p className="text-xs text-blue-700 mt-1">
                      {scanProgress < 33 && 'Extracting text...'}
                      {scanProgress >= 33 && scanProgress < 66 && 'Analyzing transaction...'}
                      {scanProgress >= 66 && 'Finalizing results...'}
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
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Extracted Transaction Data</h2>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-green-600 font-medium">Successfully extracted</span>
              </div>
            </div>

            {/* Confidence Display */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Confidence</span>
                <span className="text-sm font-bold text-green-600">{scanResult.confidence ?? 85}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${scanResult.confidence ?? 85}%` }}
                />
              </div>
            </div>

            {/* Transaction Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Merchant</label>
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

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={saveTransaction}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-[1.02] font-medium"
              >
                Save Transaction
              </button>
              <button
                onClick={scanAnotherReceipt}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-[1.02] font-medium"
              >
                Scan Another Receipt
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">Success!</h3>
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={scanAnotherReceipt}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewReceiptScanner;
