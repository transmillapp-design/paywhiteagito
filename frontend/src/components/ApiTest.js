import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';

const ApiTest = () => {
  const [apiStatus, setApiStatus] = useState('checking');
  const [apiUrl, setApiUrl] = useState(API_URL);

  useEffect(() => {
    const testApi = async () => {
      try {
        const response = await fetch(`${API_URL}/health`);
        if (response.ok) {
          setApiStatus('connected');
        } else {
          setApiStatus('error');
        }
      } catch (error) {
        setApiStatus('failed');
      }
    };

    testApi();
  }, []);

  const getStatusColor = () => {
    switch (apiStatus) {
      case 'connected': return 'text-green-600';
      case 'error': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (apiStatus) {
      case 'connected': return 'API Conectada ✅';
      case 'error': return 'API com Erro ⚠️';
      case 'failed': return 'API Indisponível ❌';
      default: return 'Testando API...';
    }
  };

  // Only show in development or if there's an error
  if (process.env.NODE_ENV === 'production' && apiStatus === 'connected') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-lg text-xs">
      <div className="font-semibold text-gray-800 dark:text-gray-200">
        Transmill API Status
      </div>
      <div className={`${getStatusColor()}`}>
        {getStatusText()}
      </div>
      <div className="text-gray-500 dark:text-gray-400 mt-1">
        URL: {apiUrl}
      </div>
      <div className="text-gray-400 dark:text-gray-500 text-xs">
        Host: {window.location.hostname}
      </div>
    </div>
  );
};

export default ApiTest;