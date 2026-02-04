from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import Response, FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gradio_client import Client, handle_file
from dotenv import load_dotenv
from pathlib import Path
import tempfile, os, shutil, time

# Load environment variables from .env file if it exists
load_dotenv()

# -------------------------------
# Response model
# -------------------------------
class AnalysisResult(BaseModel):
    predicted_class: str  # Now returns "NON_VIOLENCE" or "VIOLENCE"
    confidence: float
    frames_analyzed: int

# -------------------------------
# FastAPI setup
# -------------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://safrsight.vercel.app",
        "https://violence-detection-58u2zbaai-hen-israels-projects.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# -------------------------------
# Temporary upload directory
# -------------------------------
UPLOAD_DIR = os.path.join(tempfile.gettempdir(), "violence_detection_uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# -------------------------------
# Demo videos directory
# -------------------------------
DEMO_VIDEOS_DIR = Path(__file__).parent / "demo" / "movies"

# -------------------------------
# Routes
# -------------------------------
@app.get("/")
def read_root():
    return {"message": "Violence Detection API"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "violence-detection-api"}

@app.head("/health")
def health_check_head():
    return Response(status_code=200)

@app.get("/demo-videos")
async def list_demo_videos():
    """List all available demo videos with metadata"""
    try:
        videos = []
        if not DEMO_VIDEOS_DIR.exists():
            return {"videos": []}
        
        # Check violence subdirectory
        violence_dir = DEMO_VIDEOS_DIR / "violence"
        if violence_dir.exists():
            for video_file in violence_dir.glob("*.mp4"):
                videos.append({
                    "filename": f"violence/{video_file.name}",
                    "category": "Violence",
                    "size": video_file.stat().st_size
                })
        
        # Check no_violence subdirectory
        no_violence_dir = DEMO_VIDEOS_DIR / "no_violence"
        if no_violence_dir.exists():
            for video_file in no_violence_dir.glob("*.mp4"):
                videos.append({
                    "filename": f"no_violence/{video_file.name}",
                    "category": "Non-Violence",
                    "size": video_file.stat().st_size
                })
        return {"videos": videos}
        
    except Exception as e:
        print(f"Error listing demo videos: {e}")
        raise HTTPException(status_code=500, detail=f"Error listing demo videos: {str(e)}")

@app.get("/demo-videos/{category}/{filename}")
async def get_demo_video(category: str, filename: str):
    """Serve a specific demo video file"""
    try:
        
        file_path = DEMO_VIDEOS_DIR / category / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Video not found")
        
        if not file_path.is_file():
            raise HTTPException(status_code=400, detail="Invalid file")
        
        # Use FileResponse - CORS headers added by middleware
        return FileResponse(
            path=file_path,
            media_type="video/mp4",
            filename=filename
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error serving demo video: {e}")
        raise HTTPException(status_code=500, detail=f"Error serving video: {str(e)}")

@app.post("/upload", response_model=AnalysisResult)
async def upload_video(file: UploadFile = File(...)):

    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Please upload a video file")

    try:
        print(f"\n=== Starting new video upload ===")
        print(f"File name: {file.filename}")

        # Save uploaded video temporarily
        # Extract just the filename without any directory path
        base_filename = os.path.basename(file.filename)
        temp_file_path = os.path.join(UPLOAD_DIR, f"upload_{base_filename}")
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print(f"File saved: {temp_file_path}")

        # -------------------------------
        # Send to Hugging Face Space using gradio_client
        # -------------------------------
        print("\n=== Sending to Hugging Face Space ===")
        
        file_size_mb = os.path.getsize(temp_file_path) / 1e6
        print(f"File size: {file_size_mb:.1f}MB")
        
        # If file is too large, suggest using a smaller file
        if file_size_mb > 10:
            raise HTTPException(
                status_code=413, 
                detail=f"File too large ({file_size_mb:.1f}MB). Please use a file smaller than 10MB."
            )
        
        # Use gradio_client - the official way to interact with Gradio Spaces
        # Use local Gradio app if GRADIO_URL env var is set, otherwise use Hugging Face Space
        gradio_url = os.getenv("GRADIO_URL", "henIsrael/violence-detection")
        print(f"Calling Gradio via gradio_client at: {gradio_url}")
        client = Client(gradio_url)
        
        print("Sending video for prediction...")

        job = client.submit({"video": handle_file(temp_file_path), "subtitles": None}, api_name="/predict")
        result = job.result(timeout=300)
        print(f"Prediction result: {result}")

        # The result should be a dictionary with the prediction
        if isinstance(result, dict):
            return AnalysisResult(**result)
        elif isinstance(result, list) and len(result) > 0:
            return AnalysisResult(**result[0])
        else:
            raise HTTPException(status_code=500, detail=f"Unexpected result format: {result}")

    except Exception as e:
        print(f"\n=== Error during prediction ===")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Cleanup uploaded file
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
