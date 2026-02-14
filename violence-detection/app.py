import gradio as gr
import cv2
import numpy as np
import tensorflow as tf
from pathlib import Path
import tempfile
import os
import traceback
from enum import Enum

class ViolenceResult(Enum):
    NON_VIOLENCE = 0
    VIOLENCE = 1

class ViolenceDetector:
    def __init__(self):
        self.frame_size = (224, 224)
        self.model = tf.keras.models.load_model('LRCN.h5')
        
    def preprocess_video(self, video_file_path: str, sequence_length: int = 20) -> np.ndarray:
        # Initialize the VideoCapture object
        video_reader = cv2.VideoCapture(video_file_path)
        
        # Check if video file is opened successfully
        if not video_reader.isOpened():
            video_reader.release()
            raise ValueError(f"Could not open video file: {video_file_path}")
            
        # Get the number of frames
        video_frames_count = int(video_reader.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Check if video is long enough
        if video_frames_count < sequence_length:
            video_reader.release()
            raise ValueError(f"Video is too short. Has {video_frames_count} frames, but {sequence_length} frames required.")
            
        # Calculate frame skip window
        skip_frames_window = max(int(video_frames_count/sequence_length), 1)
        
        frames_list = []
        
        # Extract frames
        for frame_counter in range(sequence_length):
            video_reader.set(cv2.CAP_PROP_POS_FRAMES, frame_counter * skip_frames_window)
            success, frame = video_reader.read()
            
            if not success:
                video_reader.release()
                raise ValueError(f"Failed to read frame at position {frame_counter * skip_frames_window}")
                
            # Preprocess frame
            resized_frame = cv2.resize(frame, self.frame_size)
            resized_frame = cv2.cvtColor(resized_frame, cv2.COLOR_BGR2RGB)
            normalized_frame = resized_frame.astype(np.float32) / 255.0
            frames_list.append(normalized_frame)
            
        video_reader.release()
        return np.array(frames_list, dtype=np.float32)
        
    def detect(self, preprocessed_frames: np.ndarray) -> dict:
        # Add batch dimension
        frames = np.expand_dims(preprocessed_frames, axis=0)
        
        # Get predictions
        predictions = self.model.predict(frames, verbose=0)[0]
        predicted_class = int(np.argmax(predictions))
        confidence = float(predictions[predicted_class])
        
        predicted_label = ViolenceResult(predicted_class)
        
        return {
            "predicted_class": predicted_label.name,
            "confidence": confidence,
            "frames_analyzed": frames.shape[1]
        }

# Initialize detector at startup
print("Loading model... This may take a few seconds...")
detector = ViolenceDetector()
print("Model loaded successfully!")

def process_video(video):
    """
    Process uploaded video and return detection results.
    
    Args:
        video: Video file from Gradio interface (path string)
    
    Returns:
        Dictionary with detection results or error message
    """
    try:
        print(f"\n{'='*60}")
        print(f"Processing video request")
        print(f"Received type: {type(video)}")
        print(f"Received value: {video}")
        
        if video is None:
            return {"error": "No video provided"}

        # Gradio 5.x Video component returns the path as a string
        video_path = str(video)
        
        print(f"Using video path: {video_path}")

        if not os.path.exists(video_path):
            return {"error": f"Video file not found: {video_path}"}

        print(f"Processing video: {video_path}")
        
        # Preprocess and detect
        frames = detector.preprocess_video(video_path)
        result = detector.detect(frames)
        
        print(f"\nDetection Results:")
        print(f"  - Predicted Class: {result['predicted_class']}")
        print(f"  - Confidence: {result['confidence']:.2%}")
        print(f"  - Frames Analyzed: {result['frames_analyzed']}")
        print(f"{'='*60}\n")
        
        return result

    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}

# Create Gradio interface
iface = gr.Interface(
    fn=process_video,
    inputs=gr.Video(label="Upload Video"),
    outputs=gr.JSON(label="Detection Results"),
    title="Video Violence Detection (LRCN Model)",
    description="Upload a video to detect presence of violence. Returns predicted_class (NON_VIOLENCE or VIOLENCE), confidence score, and number of frames analyzed.",
    examples=[],
    cache_examples=False,
    api_name="predict"
)

# Launch the interface
# Automatically detect if running on Hugging Face Spaces or locally
is_hf_space = os.getenv("SPACE_ID") is not None

if is_hf_space:
    print("Running on Hugging Face Spaces with Gradio 5.49.1")
    iface.launch(
        share=True
    )
else:
    print("Running locally")
    iface.launch(
        server_name="127.0.0.1",
        server_port=7860,
        share=False
    )