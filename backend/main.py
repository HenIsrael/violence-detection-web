from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tempfile
import os
import shutil
from models.violence_detector import ViolenceDetector
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Environment variables
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE", 50000000))  # 50MB default

# Initialize the violence detector
detector = ViolenceDetector()

# Response models
class AnalysisResult(BaseModel):
    predicted_class: int  
    confidence: float
    frames_analyzed: int

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:3000",  # Local development
    "https://vd-web.vercel.app",  # Production frontend (we'll update this with actual URL)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create temp directories for uploads and results
UPLOAD_DIR = os.path.join(tempfile.gettempdir(), "violence_detection_uploads")
RESULT_DIR = os.path.join(tempfile.gettempdir(), "violence_detection_results")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "Violence Detection API"}

@app.post("/upload", response_model=AnalysisResult)
async def upload_video(file: UploadFile = File(...)):
    temp_file_path = None
    try:
        # Validate file type
        if not file.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="Please upload a video file")
            
        # Check file size
        file_size = 0
        while contents := await file.read(1024 * 1024):
            file_size += len(contents)
            if file_size > MAX_UPLOAD_SIZE:
                raise HTTPException(status_code=413, detail="File too large. Maximum size is 50MB.")
        await file.seek(0)
        
        # Save the uploaded file temporarily
        temp_file_path = os.path.join(UPLOAD_DIR, f"upload_{file.filename}")
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process video with 20 frames
        try:
            # Preprocess video frames
            frames = detector.preprocess_video(temp_file_path, sequence_length=20)
            # Get prediction
            result = detector.detect(frames)
            
            return AnalysisResult(
                predicted_class=result["predicted_class"],
                confidence=result["confidence"],
                frames_analyzed=result["frames_analyzed"]
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
        
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Clean up the uploaded file
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
