import React from 'react';
import ReceiptScannerComponent from '../components/ReceiptScanner';

const ReceiptScanner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <ReceiptScannerComponent />
    </div>
  );
};

export default ReceiptScanner;