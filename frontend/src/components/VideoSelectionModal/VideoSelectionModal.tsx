import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './VideoSelectionModal.css';

interface DemoVideo {
  filename: string;
  category: string;
  size: number;
}

interface VideoSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocal: () => void;
  onSelectDemo: (filename: string) => void;
}

const VideoSelectionModal: React.FC<VideoSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectLocal,
  onSelectDemo,
}) => {
  const [activeTab, setActiveTab] = useState<'local' | 'demo'>('local');
  const [demoVideos, setDemoVideos] = useState<DemoVideo[]>([]);
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'demo' && demoVideos.length === 0) {
      fetchDemoVideos();
    }
  }, [isOpen, activeTab]);

  const fetchDemoVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await axios.get(`${apiUrl}/demo-videos`);
      setDemoVideos(response.data.videos || []);
    } catch (err: any) {
      setError('Failed to load demo videos');
      console.error('Error fetching demo videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = () => {
    if (selectedDemo) {
      onSelectDemo(selectedDemo);
      setSelectedDemo(null);
    }
  };

  const handleLocalUpload = () => {
    onSelectLocal();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const groupedVideos = demoVideos.reduce((acc, video) => {
    if (!acc[video.category]) {
      acc[video.category] = [];
    }
    acc[video.category].push(video);
    return acc;
  }, {} as Record<string, DemoVideo[]>);

  if (!isOpen) return null;

  return (
    <div className="video-selection-modal-overlay" onClick={handleOverlayClick}>
      <div className="video-selection-modal">
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        
        <h2 className="modal-title">Select Video Source</h2>
        
        <div className="modal-tabs">
          <button
            className={`tab-button ${activeTab === 'local' ? 'active' : ''}`}
            onClick={() => setActiveTab('local')}
          >
            Upload from Computer
          </button>
          <button
            className={`tab-button ${activeTab === 'demo' ? 'active' : ''}`}
            onClick={() => setActiveTab('demo')}
          >
            Choose Demo Video
          </button>
        </div>
        
        <div className="modal-content">
          {activeTab === 'local' && (
            <div className="local-upload-section">
              <div className="upload-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <h3>Upload Video from Your Computer</h3>
              <p>Select a video file (MP4 format recommended, max 10MB)</p>
              <button className="cta-button cta-primary" onClick={handleLocalUpload}>
                Choose File
              </button>
            </div>
          )}
          
          {activeTab === 'demo' && (
            <div className="demo-video-section">
              {loading && <div className="loading-message">Loading demo videos...</div>}
              
              {error && <div className="error-message">{error}</div>}
              
              {!loading && !error && demoVideos.length === 0 && (
                <div className="no-videos-message">No demo videos available</div>
              )}
              
              {!loading && !error && demoVideos.length > 0 && (
                <>
                  {Object.entries(groupedVideos).map(([category, videos]) => (
                    <div key={category} className="video-category">
                      <h3 className="category-title">{category} Examples</h3>
                      <div className="demo-video-grid">
                        {videos.map((video) => (
                          <div
                            key={video.filename}
                            className={`demo-video-card ${selectedDemo === video.filename ? 'selected' : ''}`}
                            onClick={() => setSelectedDemo(video.filename)}
                          >
                            <div className="video-thumbnail">
                              <video
                                src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/demo-videos/${video.filename}`}
                                preload="metadata"
                                muted
                                onError={(e) => {
                                  console.warn(`Failed to load thumbnail for ${video.filename}`);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <div className="play-overlay">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                            <div className="video-info">
                              <div className="video-size">{(video.size / 1024 / 1024).toFixed(2)} MB</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <div className="modal-actions">
                    <button
                      className="cta-button cta-secondary"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      className="cta-button cta-primary"
                      onClick={handleSelectDemo}
                      disabled={!selectedDemo}
                    >
                      Load Selected Video
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoSelectionModal;
