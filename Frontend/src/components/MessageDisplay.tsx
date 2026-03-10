import React, { useEffect, useState } from 'react';

interface MessageData {
  message: string;
  timestamp: string;
}

const MessageDisplay: React.FC = () => {
  const [data, setData] = useState<MessageData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://finai-final-mngt-production.up.railway.app/api/message');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result: MessageData = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Message from Backend:</h2>
      <p>{data?.message}</p>
      <p>Timestamp: {data?.timestamp}</p>
    </div>
  );
};

export default MessageDisplay;
