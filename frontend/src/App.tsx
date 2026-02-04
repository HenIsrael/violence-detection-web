import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import ElectricHero from './electricXtra/Hero';
import ResultMessage from './components/ResultMessage/ResultMessage';
import VideoSelectionModal from './components/VideoSelectionModal/VideoSelectionModal';

// Vercel configured to build only when frontend changes

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showVideoSelectionModal, setShowVideoSelectionModal] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const abortReasonRef = useRef<'user' | null>(null);

  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  const handleFileButtonClick = () => {
    if (analyzing) {
      return;
    }
    fileInputRef.current?.click();
  };

  const scrollToConsole = () => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const detectorSection = document.getElementById('detector');
        if (detectorSection) {
          detectorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  };

  const handleGetStarted = () => {
    if (analyzing) {
      return;
    }
    setShowVideoSelectionModal(true);
  };

  const handleSelectLocalUpload = () => {
    setShowVideoSelectionModal(false);
    // Small delay to ensure modal closes smoothly before file dialog opens
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  const handleSelectDemoVideo = async (filename: string) => {
    try {
      setShowVideoSelectionModal(false);
      setError(null);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
      // ADD A TIMESTAMP: This trick forces the browser to bypass the bad cache
      const videoUrl = `${apiUrl}/demo-videos/${filename}?t=${new Date().getTime()}`
      console.log(`Loading demo video: ${filename} from ${videoUrl}`);
      
      // Use fetch with no-cors mode to get the video, then create a blob from it
      // Since the video element can load it, we'll use a workaround
      const response = await fetch(videoUrl, {
        method: 'GET',
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('Demo video loaded successfully, size:', blob.size);
      
      // Validate blob
      if (!blob || blob.size === 0) {
        throw new Error('Received empty video file');
      }
      
      const file = new File([blob], filename, { type: 'video/mp4' });
      
      setSelectedFile(file);
      setAnalysisResult(null);
      
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
      
      const previewUrl = URL.createObjectURL(blob);
      setVideoPreview(previewUrl);
      
      console.log('Demo video preview created successfully');
    } catch (err: any) {
      console.error('Error loading demo video:', err);
      
      let message = 'Failed to load demo video';
      
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        message = 'CORS error - backend may need to be restarted';
      } else if (err.message) {
        message = err.message;
      }
      
      setError(message);
      window.alert(message);
    }
  };

  const handleDetect = () => {
    if (analyzing) {
      window.alert('Video analysis already in progress.');
      return;
    }
    if (!selectedFile) {
      window.alert('Please choose a video file first.');
      return;
    }
    const MAX_SIZE = 10 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE) {
      setAnalysisResult(null);
      setError('Try smaller video file');
      scrollToConsole();
      return;
    }
    setError(null);
    scrollToConsole();
    uploadVideo(selectedFile);
  };

  const handleTryDifferent = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }

    setSelectedFile(null);
    setVideoPreview(null);
    setError(null);

    if (analyzing && abortControllerRef.current) {
      abortReasonRef.current = 'user';
      abortControllerRef.current.abort();
    } else {
      setAnalysisResult(null);
    }

    // Open the video selection modal
    setShowVideoSelectionModal(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const candidate = files[0];

      setSelectedFile(candidate);
      setAnalysisResult(null);
      setError(null);
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
      const previewUrl = URL.createObjectURL(candidate);
      setVideoPreview(previewUrl);
      // Allow selecting the same file again
      event.target.value = '';
    }
  };

  const uploadVideo = async (videoFile: File) => {
    setAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    abortReasonRef.current = null;
    const formData = new FormData();
    formData.append('file', videoFile);

    try {
      // Use environment variable for API URL, fallback to localhost for development
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal: controller.signal,
      });
      setAnalysisResult(response.data);
    } catch (err: any) {
      if (
        err?.code === 'ERR_CANCELED' ||
        err?.name === 'CanceledError' ||
        err?.message === 'canceled'
      ) {
        if (abortReasonRef.current === 'user') {
          setAnalysisResult({
            predicted_class: 'Prediction stopped',
            confidence: 0,
          });
          setError(null);
        }
      } else {
        const message =
          err.response?.data?.detail ||
          'An error occurred while uploading the file';
        console.error(message);
        window.alert(message);
        setError(message);
      }
    } finally {
      setAnalyzing(false);
      abortControllerRef.current = null;
      abortReasonRef.current = null;
    }
  };

  const analysisVisible = Boolean(
    videoPreview || analyzing || analysisResult || error,
  );

  return (
    <div className="App">
      <VideoSelectionModal
        isOpen={showVideoSelectionModal}
        onClose={() => setShowVideoSelectionModal(false)}
        onSelectLocal={handleSelectLocalUpload}
        onSelectDemo={handleSelectDemoVideo}
      />
      <ElectricHero
        onGetStarted={handleGetStarted}
        onDetect={handleDetect}
        detectDisabled={analyzing || !selectedFile}
      />
      <header
        className={`App-header ${analysisVisible ? 'visible' : ''}`}
        id="detector"
      >
        {analysisVisible && (
          <div className="analysis-console">
            <div className="console-header">
              <span className="console-title">Analysis Console</span>
            </div>
            <div className="console-actions">
                <span
                  className={`console-status ${
                    analyzing
                      ? 'status-active'
                      : error
                      ? 'status-error'
                      : analysisResult
                      ? 'status-complete'
                      : 'status-idle'
                  }`}
                >
                  {analyzing
                    ? 'Scanning...'
                    : error
                    ? 'Error'
                    : analysisResult
                    ? 'Completed'
                    : 'Ready'}
                </span>
                <button
                  type="button"
                  className="console-reset"
                  onClick={handleTryDifferent}
                >
                  Try Different Video
                </button>
              </div>
            <div className="console-divider" />
            {analyzing && (
              <div className="console-progress">
                <div className="progress-track">
                  <div className="progress-indicator" />
                </div>
                <p className="console-progress-label">Making prediction...</p>
              </div>
            )}
            {analysisResult && (
              <div className="analysis-result">
                <ResultMessage
                  predictedClass={analysisResult.predicted_class}
                  confidence={analysisResult.confidence}
                />
              </div>
            )}
            {error && <div className="console-error">{error}</div>}
            {videoPreview && (
              <div className="console-video">
                <video
                  src={videoPreview}
                  controls
                  preload="metadata"
                  className={analyzing ? 'is-blurred' : ''}
                />
              </div>
            )}
          </div>
        )}
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          disabled={analyzing}
          ref={fileInputRef}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      </header>
    </div>
  );
}

export default App;