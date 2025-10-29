# Violence Detection Web App

A web application for detecting violence in videos using deep learning. The app uses a FastAPI backend that communicates with a Hugging Face Space running a pre-trained LRCN model.

## 🎯 Features

- Upload and analyze videos for violence detection
- Real-time prediction with confidence scores
- Clean, modern UI built with React and TypeScript
- Serverless ML model inference via Hugging Face Spaces

## 🏗️ Architecture

```
Frontend (React) → Backend (FastAPI) → Hugging Face Space (Gradio)
```

- **Frontend**: User interface for video upload and results display
- **Backend**: API server handling video uploads and communicating with Hugging Face
- **Hugging Face Space**: Hosts the ML model and provides inference API

## 🚀 Quick Start (Local Development)

### Prerequisites

- Python 3.10+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the server:
   ```bash
   uvicorn main:app --reload
   ```

   Backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (optional, defaults to localhost):
   ```bash
   echo "REACT_APP_API_URL=http://localhost:8000" > .env
   ```

4. Start the development server:
   ```bash
   npm start
   ```

   Frontend will run on `http://localhost:3000`

## 📦 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

**Quick summary:**
1. Deploy backend to Railway/Render/Heroku
2. Deploy frontend to Vercel/Netlify
3. Update backend CORS settings
4. Set frontend environment variable `REACT_APP_API_URL`

## 🧪 Testing

Upload a video file through the web interface. The app will:
1. Send the video to the backend
2. Backend forwards it to Hugging Face Space
3. ML model analyzes the video
4. Results are returned and displayed

### Expected Response

```json
{
  "predicted_class": 1,
  "confidence": 0.9574,
  "frames_analyzed": 20
}
```

- `predicted_class`: 0 = Non-violent, 1 = Violent
- `confidence`: Confidence score (0-1)
- `frames_analyzed`: Number of video frames processed

## 📁 Project Structure

```
vdWeb/
├── backend/              # FastAPI backend
│   ├── main.py         # API server
│   └── requirements.txt
├── frontend/            # React frontend
│   ├── src/
│   │   └── App.tsx     # Main component
│   └── package.json
├── violence-detection/  # Hugging Face Space (deployed separately)
│   └── app.py          # Gradio interface
└── DEPLOYMENT.md       # Deployment guide
```

## 🔧 Configuration

### Backend

- Port: 8000 (default) or set via `PORT` environment variable
- CORS: Configured for `localhost:3000` and production URLs

### Frontend

- API URL: Set via `REACT_APP_API_URL` environment variable
- Defaults to `http://localhost:8000` if not set

## 🐛 Troubleshooting

### Connection Errors
- Ensure backend is running before starting frontend
- Check CORS settings in `backend/main.py`
- Verify Hugging Face Space is accessible

### Timeout Errors
- Video file size should be < 10MB
- Check network connection
- Backend timeout is set to 5 minutes

### Model Errors
- Ensure Hugging Face Space is running
- Check Space logs on Hugging Face
- Verify API endpoint is correct

## 📝 License

This project is open source and available for use.

## 👤 Author

HenIsrael

## 🙏 Acknowledgments

- Hugging Face for hosting the ML model
- FastAPI for the excellent backend framework
- React for the frontend framework

