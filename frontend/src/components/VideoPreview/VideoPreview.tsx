import React from 'react';
import './VideoPreview.css';

interface VideoPreviewProps {
  videoUrl: string;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ videoUrl }) => {
  return (
    <div className="video-preview-container">
      <video 
        src={videoUrl} 
        controls 
        className="video-preview"
      />
    </div>
  );
};

export default VideoPreview;

