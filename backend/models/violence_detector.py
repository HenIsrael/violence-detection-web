import cv2
import numpy as np
from tensorflow.keras.models import load_model
import os
import requests
from typing import Dict, Any
from pathlib import Path

class ViolenceDetector:
    def __init__(self):
        self.frame_size = (224, 224)  # Same as your SIZE parameter
        
        # Get model URL from environment variable
        self.model_url = os.getenv('MODEL_URL')
        if not self.model_url:
            raise ValueError("MODEL_URL environment variable not set")
        
        # Setup model paths
        self.weights_dir = os.path.join(os.path.dirname(__file__), 'weights')
        self.model_path = os.path.join(self.weights_dir, 'LRCN.h5')
        
        # Ensure weights directory exists
        os.makedirs(self.weights_dir, exist_ok=True)
        
        # Download model if not exists
        if not os.path.exists(self.model_path):
            self._download_model()
        
        # Load the model
        self.model = load_model(self.model_path)
        
    def _download_model(self):
        """Download the model from the URL specified in environment variables."""
        print(f"Downloading model from {self.model_url}")
        response = requests.get(self.model_url, stream=True)
        response.raise_for_status()
        
        # Save the model
        with open(self.model_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Model downloaded successfully to {self.model_path}")
        
    def preprocess_video(self, video_file_path: str, sequence_length: int = 20) -> np.ndarray:
        """
        This function will perform preprocessing on a video for violence detection.
        Args:
        video_file_path: The path of the video stored in the disk on which the action recognition is to be performed.
        sequence_length: The number of frames to extract from the video (default: 20)
                       While model was trained on 20 frames, empirical testing shows good results
                       with ensemble predictions using different sequence lengths (20, 30, 40)
        Returns:
        frames_list: Numpy array of preprocessed frames
        """
        '''
        This function will perform preprocessing on a video for violence detection.
        Args:
        video_file_path: The path of the video stored in the disk on which the action recognition is to be performed.
        sequence_length: The fixed number of frames to extract from the video.
        Returns:
        frames_list: Numpy array of preprocessed frames
        '''
        # Initialize the VideoCapture object to read from the video file.
        video_reader = cv2.VideoCapture(video_file_path)

        # Check if video file is opened successfully
        if not video_reader.isOpened():
            video_reader.release()
            raise ValueError(f"Could not open video file: {video_file_path}")

        # Get the number of frames in the video.
        video_frames_count = int(video_reader.get(cv2.CAP_PROP_FRAME_COUNT))

        # Check if video is long enough
        if video_frames_count < sequence_length:
            video_reader.release()
            raise ValueError(
                f"Video is too short. Has {video_frames_count} frames, but {sequence_length} frames required."
            )

        # Calculate the interval after which frames will be added to the list.
        skip_frames_window = max(int(video_frames_count/sequence_length), 1)

        # Declare a list to store video frames we will extract.
        frames_list = []

        # Iterating the number of times equal to the fixed length of sequence.
        for frame_counter in range(sequence_length):
            # Set the current frame position of the video.
            video_reader.set(cv2.CAP_PROP_POS_FRAMES, frame_counter * skip_frames_window)

            # Read a frame.
            success, frame = video_reader.read() 

            # Check if frame is not read properly
            if not success:
                video_reader.release()
                raise ValueError(f"Failed to read frame at position {frame_counter * skip_frames_window}")

            # Resize the Frame to fixed Dimensions.
            resized_frame = cv2.resize(frame, self.frame_size)
            
            # Convert to RGB (since OpenCV reads in BGR)
            resized_frame = cv2.cvtColor(resized_frame, cv2.COLOR_BGR2RGB)
            
            # Normalize using the same rescaling as in training
            normalized_frame = resized_frame.astype(np.float32) / 255.0
            
            # Appending the pre-processed frame into the frames list
            frames_list.append(normalized_frame)

        video_reader.release()

        return np.array(frames_list, dtype=np.float32)  # Ensure float32 output
        
    def detect(self, preprocessed_frames: np.ndarray) -> Dict[str, Any]:
        """
        Detect violence in preprocessed video frames
        Args:
        preprocessed_frames: Numpy array of preprocessed frames
                           Shape should be (sequence_length, height, width, channels)
        Returns:
        Dictionary containing:
            - predicted_class: Index of predicted class (0 for NoViolence, 1 for Violence)
            - confidence: Confidence score of the prediction
            - frames_analyzed: Number of frames analyzed
        """
        # Add batch dimension for model input
        frames = np.expand_dims(preprocessed_frames, axis=0)
        
        # Get predictions (passing verbose=0 to suppress progress bar)
        predicted_labels_probabilities = self.model.predict(frames, verbose=0)[0]
        
        # Get the index of class with highest probability
        predicted_label = np.argmax(predicted_labels_probabilities)
        
        # Get the confidence score for the predicted class
        confidence = float(predicted_labels_probabilities[predicted_label])
        
        return {
            "predicted_class": int(predicted_label),  # 0 for NoViolence, 1 for Violence
            "confidence": confidence,
            "frames_analyzed": frames.shape[1],  # sequence_length is the second dimension now
        }