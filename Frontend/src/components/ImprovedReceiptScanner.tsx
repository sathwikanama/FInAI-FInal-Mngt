/**
 * Improved Receipt Scanner Component
 * Professional fintech-style UI with all requested fixes and features
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
  ChevronUpIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import ocrService from '../services/ocrService';

interface ImprovedReceiptScannerProps {
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

const ImprovedReceiptScanner: React.FC<ImprovedReceiptScannerProps> = ({ className = '' }) => {
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
  const [receiptHistory, setReceiptHistory] = useState<any[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fetch receipt history
  const fetchReceiptHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/transactions?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setReceiptHistory(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch receipt history:', error);
    }
  }, []);

  useEffect(() => {
    fetchReceiptHistory();
  }, [fetchReceiptHistory]);

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

  // Camera capture functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCameraModal(true);
    } catch (error) {
      setError('Camera access denied or not available');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          processFile(file);
          stopCamera();
        }
      }, 'image/jpeg', 0.95);
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
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
        setSuccess('Transaction saved successfully!');
        fetchReceiptHistory();
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

  const uploadAnother = () => {
    removeImage();
    setScanResult(null);
    setError(null);
    setSuccess(null);
  };

  const copyDetails = () => {
    const details = `Merchant: ${transactionData.merchant_name}\nAmount: ₹${transactionData.amount}\nCategory: ${transactionData.category}\nDate: ${transactionData.date}\nDescription: ${transactionData.description}`;
    navigator.clipboard.writeText(details);
    setSuccess('Details copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  const downloadReceipt = () => {
    if (uploadedImage) {
      const link = document.createElement('a');
      link.href = uploadedImage;
      link.download = `receipt-${Date.now()}.jpg`;
      link.click();
    }
  };

  const deleteReceipt = () => {
    removeImage();
    setSuccess('Receipt deleted successfully!');
    setTimeout(() => setSuccess(null), 2000);
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
            {/* Upload Card */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              {!uploadedImage ? (
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
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                    >
                      <PhotoIcon className="h-5 w-5 mr-2" />
                      Upload File
                    </button>
                    
                    <button
                      onClick={startCamera}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
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
                // Image Preview with proper sizing
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className={`relative transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
                      <img
                        src={uploadedImage || ''}
                        alt="Receipt preview"
                        className="w-full rounded-lg border border-gray-300"
                        style={{ maxHeight: '220px', objectFit: 'contain' }}
                        onLoad={() => setImageLoaded(true)}
                      />
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600 text-center">
                      {uploadedFile?.name} • {Math.round((uploadedFile?.size || 0) / 1024)} KB
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      onClick={scanReceipt}
                      disabled={scanning}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 flex items-center justify-center text-sm font-medium"
                    >
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      Scan
                    </button>
                    
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center text-sm font-medium"
                    >
                      <CameraIcon className="h-4 w-4 mr-2" />
                      Retake
                    </button>
                    
                    <button
                      onClick={uploadAnother}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center text-sm font-medium"
                    >
                      <ArrowPathIcon className="h-4 w-4 mr-2" />
                      Upload
                    </button>
                    
                    <button
                      onClick={removeImage}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center text-sm font-medium"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </div>

                  {/* Scanning Progress */}
                  {scanning && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-center mb-3">
                        <p className="text-sm font-medium text-blue-900">Scanning Receipt...</p>
                        <p className="text-xs text-blue-700 mt-1">
                          {scanProgress < 33 && 'Extracting Text...'}
                          {scanProgress >= 33 && scanProgress < 66 && 'Analyzing Transaction...'}
                          {scanProgress >= 66 && 'Finalizing Results...'}
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

                {/* 2-Column Grid Layout */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Merchant Name</p>
                    <p className="font-semibold text-gray-900">{scanResult.merchant_name || 'Not detected'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Total Amount</p>
                    <p className="font-semibold text-gray-900">₹{scanResult.amount || 'Not detected'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Date</p>
                    <p className="font-semibold text-gray-900">{scanResult.date || new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Category</p>
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{categoryIcons[scanResult.category] || '📋'}</span>
                      <p className="font-semibold text-gray-900">{scanResult.category || 'Other'}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Payment Method</p>
                    <p className="font-semibold text-gray-900">{scanResult.payment_method || 'Not detected'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">OCR Confidence</p>
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
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
                  <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Description</p>
                  <p className="font-semibold text-gray-900">{scanResult.description || `OCR: ${scanResult.merchant_name || 'Receipt'}`}</p>
                </div>

                {/* Raw OCR Text Viewer */}
                <div className="border-t pt-4 mb-6">
                  <button
                    onClick={() => setShowRawText(!showRawText)}
                    className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <span>View OCR Raw Text</span>
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

                {/* Action Buttons */}
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

                {/* Receipt Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <button
                    onClick={copyDetails}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center text-sm"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                    Copy Details
                  </button>
                  <button
                    onClick={downloadReceipt}
                    className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center text-sm"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Download
                  </button>
                  <button
                    onClick={deleteReceipt}
                    className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center text-sm"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete
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
                <div className="space-y-2 text-sm text-green-700">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Receipt processed successfully
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Transaction saved
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

          {/* Receipt History Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Receipt History</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {receiptHistory.length > 0 ? (
                  receiptHistory.map((receipt) => (
                    <div key={receipt.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{categoryIcons[receipt.category] || '📋'}</span>
                          <p className="font-medium text-gray-900 text-sm">{receipt.merchant_name || 'Receipt'}</p>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm">₹{receipt.amount}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{receipt.category || 'Other'}</span>
                        <span>{new Date(receipt.created_at).toLocaleDateString()}</span>
                      </div>
                      <button className="mt-2 w-full px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors text-xs font-medium flex items-center justify-center">
                        <EyeIcon className="h-3 w-3 mr-1" />
                        View Details
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center text-sm">No receipts found</p>
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
                  className="w-full rounded-lg"
                />
              </div>
              
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="flex gap-3">
                <button
                  onClick={capturePhoto}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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

export default ImprovedReceiptScanner;
