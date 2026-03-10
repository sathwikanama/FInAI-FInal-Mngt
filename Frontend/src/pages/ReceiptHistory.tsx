import React, { useState, useEffect } from 'react';

const ReceiptHistory = () => {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetch("https://finai-final-mngt-production.up.railway.app/api/ocr/history")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHistory(data.data);
        }
      })
      .catch(error => {
        console.error("History fetch error:", error);
      });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">All Scanned Receipts</h1>

      {history.length === 0 ? (
        <p className="text-gray-500">No receipts scanned yet</p>
      ) : (
        <div className="space-y-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex justify-between p-4 border-b"
            >
              <span>Receipt #{item.id}</span>
              <span className="font-semibold">₹{item.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReceiptHistory;
