from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from gradio_client import Client, handle_file
import tempfile, os, shutil, time

# -------------------------------
# Response model
# -------------------------------
class AnalysisResult(BaseModel):
    predicted_class: int
    confidence: float
    frames_analyzed: int

# -------------------------------
# FastAPI setup
# -------------------------------
app = FastAPI()

# Allow local dev, the original Vercel domain, and any Vercel preview/prod domain
origins = [
    "http://localhost:3000",
    "https://vd-web.vercel.app",
    "https://violence-detection-web-woad.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# Temporary upload directory
# -------------------------------
UPLOAD_DIR = os.path.join(tempfile.gettempdir(), "violence_detection_uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

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

@app.post("/upload", response_model=AnalysisResult)
async def upload_video(file: UploadFile = File(...)):

    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Please upload a video file")

    try:
        print(f"\n=== Starting new video upload ===")
        print(f"File name: {file.filename}")

        # Save uploaded video temporarily
        temp_file_path = os.path.join(UPLOAD_DIR, f"upload_{file.filename}")
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
        print("Calling Hugging Face Space via gradio_client...")
        client = Client("henIsrael/violence-detection")
        
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