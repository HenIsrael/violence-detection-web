import gradio as gr
import cv2
import numpy as np
import tensorflow as tf
from pathlib import Path
import tempfile
import os
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
    try:
        print(f"=== process_video called at Hugging Face Space ===")
        print(f"Received type: {type(video)} | value: {repr(video)}")

        if video is None:
            return {"error": "No video provided"}

        # Handle all formats that Gradio might send
        if isinstance(video, dict) and "name" in video:
            video_path = video["name"]
            print(f"Extracted video path from dict: {video_path}")
        elif isinstance(video, (list, tuple)) and len(video) > 0:
            video_path = video[0]
            print(f"Extracted video path from list: {video_path}")
        elif isinstance(video, str):
            video_path = video
            print(f"Using video path directly: {video_path}")
        else:
            return {"error": f"Unsupported video format: {type(video)}"}

        if not os.path.exists(video_path):
            return {"error": f"Video file not found: {video_path}"}

        print(f"Processing video: {video_path}")
        frames = detector.preprocess_video(video_path)
        result = detector.detect(frames)
        print(f"Detection result: {result}")
        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

# Create Gradio interface with proper API support

iface = gr.Interface(
    fn=process_video,
    inputs=gr.Video(),
    outputs=gr.JSON(),
    title="Video Violence Detection",
    description="Upload a video to detect presence of violence. Returns predicted_class (0: No Violence, 1: Violence), confidence score, and number of frames analyzed.",
    examples=[],
    cache_examples=False,
    api_name="predict"
)

# Launch the interface - Hugging Face Spaces will automatically run this
# Automatically detect if running on Hugging Face Spaces or locally
# Hugging Face Spaces sets SPACE_ID environment variable
is_hf_space = os.getenv("SPACE_ID") is not None

if is_hf_space:
    # Running on Hugging Face Spaces - use default settings
    iface.launch(
        show_api=True,  
        ssr_mode=False,
        share=True
    )
else:
    # Running locally - use localhost settings for testing
    iface.launch(
        server_name="127.0.0.1",
        server_port=7860,
        show_api=True,  
        ssr_mode=False,
        share=False
    )