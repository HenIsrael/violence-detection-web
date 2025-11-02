import React, { useState } from 'react';
import axios from 'axios';
import LinearProgress from '@mui/material/LinearProgress';
import './App.css';

// Vercel configured to build only when frontend changes

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Use environment variable for API URL, fallback to localhost for development
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data);
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('An error occurred while uploading the file');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Violence Detection App</h1>
        <div className="upload-container">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <button 
            onClick={handleUpload} 
            disabled={!file || uploading}
          >
            {uploading ? 'Analyzing...' : 'Analyze Video'}
          </button>
        </div>

        {uploading && (
          <div className="progress-container">
            <LinearProgress />
            <p className="progress-text">Analyzing video...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {result && (
          <div className="result-container">
            <h2>Analysis Result</h2>
            <div className="result-content">
              <div className="result-item">
                <span className="result-label">Detection:</span>
                <span className={`result-value ${result.predicted_class === 'VIOLENCE' ? 'violence' : 'no-violence'}`}>
                  {result.predicted_class === 'VIOLENCE' ? 'Violence' : 
                   result.predicted_class === 'NON_VIOLENCE' ? 'No Violence' : 
                   result.predicted_class}
                </span>
              </div>
              <div className="result-item">
                <span className="result-label">Confidence:</span>
                <span className="result-value">
                  {typeof result.confidence === 'number' 
                    ? `${Math.round(result.confidence * 100)}%` 
                    : result.confidence}
                </span>
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;