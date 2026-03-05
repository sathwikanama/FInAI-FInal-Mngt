/**
 * Modern Receipt Scanner Component
 * Professional fintech-style UI with improved layout and animations
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
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import ocrService from '../services/ocrService';

interface ModernReceiptScannerProps {
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

const ModernReceiptScanner: React.FC<ModernReceiptScannerProps> = ({ className = '' }) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(false);
  const [transactionData, setTransactionData] = useState({
    amount: '',
    category: 'Other',
    description: '',
    merchant_name: '',
    payment_method: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  // Fetch recent scans
  const fetchRecentScans = useCallback(async () => {
    try {
      const response = await ocrService.getHistory();
      if (response.success) {
        setRecentScans(response.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to fetch recent scans:', error);
    }
  }, []);

  React.useEffect(() => {
    fetchRecentScans();
  }, [fetchRecentScans]);

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
        setScanProgress(prev => Math.min(prev + 10, 90));
      }, 200);

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
        setSuccess('Transaction saved successfully! Dashboard updated.');
        setEditingTransaction(false);
        fetchRecentScans();
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

  const rescanReceipt = () => {
    setScanResult(null);
    setEditingTransaction(false);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-5 gap-8 ${className}`}>
      {/* Left Section - Upload & Preview (40%) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Upload Area */}
        {!uploadedImage && !showCamera && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 transition-all duration-300 hover:shadow-lg">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                dragOver 
                  ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-white'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4 transition-colors" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drag & Drop your receipt here
              </p>
              <p className="text-sm text-gray-500 mb-6">or</p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center"
                >
                  <PhotoIcon className="h-5 w-5 mr-2" />
                  Choose File
                </button>
                
                <button
                  onClick={startCamera}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center"
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
          </div>
        )}

        {/* Camera View */}
        {showCamera && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 transition-all duration-300">
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
            <div className="flex justify-center mt-4">
              <button
                onClick={capturePhoto}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                Capture Photo
              </button>
            </div>
          </div>
        )}

        {/* Image Preview */}
        {uploadedImage && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 transition-all duration-300">
            <div className={`relative transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <img
                src={uploadedImage}
                alt="Receipt preview"
                className="w-full rounded-lg"
                onLoad={() => setImageLoaded(true)}
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all duration-300 transform hover:scale-110"
                  title="Replace image"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={removeImage}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-300 transform hover:scale-110"
                  title="Remove image"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{uploadedFile?.name}</p>
              <p className="text-xs text-gray-500">
                {(uploadedFile?.size || 0) / 1024 < 1024 
                  ? `${Math.round((uploadedFile?.size || 0) / 1024)} KB`
                  : `${Math.round((uploadedFile?.size || 0) / (1024 * 1024))} MB`
                }
              </p>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={scanReceipt}
                disabled={scanning}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center"
              >
                {scanning ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Scan Receipt
                  </>
                )}
              </button>
            </div>

            {/* Progress Indicator */}
            {scanning && (
              <div className="mt-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span className="font-medium">Scanning Receipt...</span>
                    <span className="font-bold text-blue-600">{scanProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    {scanProgress < 30 && '📤 Uploading image...'}
                    {scanProgress >= 30 && scanProgress < 60 && '🧠 OCR Processing...'}
                    {scanProgress >= 60 && scanProgress < 90 && '📊 Extracting transaction data...'}
                    {scanProgress >= 90 && '✅ Finalizing results...'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Section - OCR Results (60%) */}
      <div className="lg:col-span-3 space-y-6">
        {/* OCR Results Panel */}
        {scanResult && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Extracted Transaction Data</h3>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-green-600 font-medium">Successfully Extracted</span>
              </div>
            </div>

            {!editingTransaction ? (
              <div className="space-y-4">
                {/* Grid Layout for Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Merchant Name</p>
                    <p className="font-semibold text-gray-900">{scanResult.merchant_name || 'Not detected'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Amount</p>
                    <p className="font-semibold text-gray-900">₹{scanResult.amount || 'Not detected'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Category</p>
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{categoryIcons[scanResult.category] || '📋'}</span>
                      <p className="font-semibold text-gray-900">{scanResult.category || 'Other'}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Payment Method</p>
                    <p className="font-semibold text-gray-900">{scanResult.payment_method || 'Not detected'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Date</p>
                    <p className="font-semibold text-gray-900">{scanResult.date || new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Confidence Score</p>
                    <div className="flex items-center">
                      <div className="flex-1 mr-3">
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${scanResult.confidence || 85}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-green-600">{scanResult.confidence || 85}%</span>
                    </div>
                  </div>
                </div>

                {/* Description - Full Width */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Description</p>
                  <p className="font-semibold text-gray-900">{scanResult.description || `OCR: ${scanResult.merchant_name || 'Receipt'}`}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditingTransaction(true)}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg font-medium"
                  >
                    Edit Transaction
                  </button>
                  <button
                    onClick={saveTransaction}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 hover:shadow-lg font-medium"
                  >
                    Save Transaction
                  </button>
                </div>

                {/* Raw OCR Text */}
                <div className="border-t pt-4">
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
              </div>
            ) : (
              /* Editable Transaction Form */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={transactionData.date}
                      onChange={(e) => setTransactionData({...transactionData, date: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  <div className="col-span-2">
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

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditingTransaction(false)}
                    className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveTransaction}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 hover:shadow-lg font-medium"
                  >
                    Save Transaction
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Success State */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">Success!</h3>
                <p className="text-green-700">{success}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-green-700">
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Receipt processed successfully
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Transaction added to your records
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Dashboard updated with latest data
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-900">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
            {scanResult && (
              <button
                onClick={rescanReceipt}
                className="mt-4 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center font-medium"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Rescan Receipt
              </button>
            )}
          </div>
        )}

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Scans</h3>
            <div className="space-y-3">
              {recentScans.map((scan) => (
                <div key={scan.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{categoryIcons[scan.category] || '📋'}</div>
                    <div>
                      <p className="font-medium text-gray-900">{scan.merchant_name || 'Receipt'}</p>
                      <p className="text-sm text-gray-500">{new Date(scan.scannedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{scan.amount}</p>
                    <p className="text-xs text-gray-500">{scan.category || 'Other'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernReceiptScanner;
