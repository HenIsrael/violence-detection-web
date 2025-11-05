import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import LinearProgress from '@mui/material/LinearProgress';
import Button from '@mui/material/Button';
import VideoPreview from './components/VideoPreview/VideoPreview';
import ResultMessage from './components/ResultMessage/ResultMessage';
import './App.css';

// Vercel configured to build only when frontend changes

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Cleanup video preview URL on unmount
  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setError(null);
      setResult(null);
      
      // Cleanup previous preview URL if exists
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
      
      // Create preview URL for video
      const previewUrl = URL.createObjectURL(selectedFile);
      setVideoPreview(previewUrl);
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
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          <Button
            variant="outlined"
            onClick={handleFileButtonClick}
            disabled={uploading}
            sx={{ mb: 2 }}
          >
            Choose Video File
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            Detect
          </Button>
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
            <div className="result-content">
              <ResultMessage 
                predictedClass={result.predicted_class}
                confidence={result.confidence}
              />
            </div>
          </div>
        )}

        {videoPreview && <VideoPreview videoUrl={videoPreview} />}
      </header>
    </div>
  );
}

export default App;