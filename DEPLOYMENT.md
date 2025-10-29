# Deployment Guide

This guide will help you deploy the Violence Detection Web App so that others can use it.

## 🏗️ Architecture Overview

The app consists of three parts:
1. **Frontend** (React) - User interface
2. **Backend** (FastAPI) - API server that communicates with Hugging Face
3. **Hugging Face Space** - Already deployed! ✅ (`henIsrael/violence-detection`)

## 📋 Prerequisites

- GitHub account (for hosting code)
- Vercel account (for frontend) - Free tier available
- Railway or Render account (for backend) - Free tier available

---

## 🚀 Step 1: Deploy Backend (FastAPI)

### Option A: Railway (Recommended - Easy)

1. **Sign up**: Go to [railway.app](https://railway.app) and sign up with GitHub
2. **New Project**: Click "New Project" → "Deploy from GitHub repo"
3. **Select Repository**: Choose your `violence-detection-web` repository
4. **Configure**:
   - Root Directory: `backend`
   - Build Command: (leave empty)
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Python Version: 3.10
5. **Set Environment Variables**: (Usually none needed)
6. **Deploy**: Railway will automatically detect `requirements.txt` and install dependencies
7. **Get URL**: After deployment, copy your app URL (e.g., `https://your-app.railway.app`)

### Option B: Render

1. **Sign up**: Go to [render.com](https://render.com) and sign up
2. **New Web Service**: Click "New" → "Web Service"
3. **Connect GitHub**: Link your repository
4. **Configure**:
   - **Name**: `violence-detection-backend`
   - **Root Directory**: `backend`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. **Deploy**: Click "Create Web Service"
6. **Get URL**: Copy your app URL (e.g., `https://your-app.onrender.com`)

### Option C: Heroku

1. **Install Heroku CLI**: [toolbelt.heroku.com](https://toolbelt.heroku.com)
2. **Login**: `heroku login`
3. **Create App**: `heroku create your-app-name`
4. **Deploy**: 
   ```bash
   cd backend
   git init
   git add .
   git commit -m "Deploy backend"
   heroku git:remote -a your-app-name
   git push heroku master
   ```
5. **Get URL**: Your app will be at `https://your-app-name.herokuapp.com`

### After Backend Deployment

1. **Update CORS**: Edit `backend/main.py` and add your frontend URL to the `origins` list:
   ```python
   origins = [
       "http://localhost:3000",
       "https://vd-web.vercel.app",  # Your frontend URL
       "https://your-frontend-url.vercel.app",  # Add this
   ]
   ```
2. **Commit and push** the changes

---

## 🌐 Step 2: Deploy Frontend (React)

### Using Vercel (Recommended - Easiest)

1. **Sign up**: Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. **New Project**: Click "Add New" → "Project"
3. **Import Repository**: Select your `violence-detection-web` repository
4. **Configure**:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `build` (auto-detected)
5. **Environment Variables**: Add:
   - Name: `REACT_APP_API_URL`
   - Value: `https://your-backend-url.railway.app` (or your backend URL)
6. **Deploy**: Click "Deploy"
7. **Get URL**: Your app will be at `https://your-project.vercel.app`

### Using Netlify

1. **Sign up**: Go to [netlify.com](https://netlify.com) and sign up with GitHub
2. **New Site**: Click "Add new site" → "Import an existing project"
3. **Connect GitHub**: Select your repository
4. **Configure**:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
5. **Environment Variables**: Add `REACT_APP_API_URL` = your backend URL
6. **Deploy**: Click "Deploy site"

---

## ✅ Step 3: Update Backend CORS

After deploying the frontend, update the backend CORS settings:

1. Edit `backend/main.py`
2. Add your frontend URL to the `origins` list:
   ```python
   origins = [
       "http://localhost:3000",
       "https://vd-web.vercel.app",
       "https://your-actual-frontend-url.vercel.app",  # Add this
   ]
   ```
3. Commit and push:
   ```bash
   git add backend/main.py
   git commit -m "Update CORS for production frontend"
   git push origin master
   ```
4. The backend will auto-redeploy with the new CORS settings

---

## 🧪 Step 4: Test Everything

1. **Test Backend**: Visit `https://your-backend-url.railway.app/docs` - you should see the FastAPI docs
2. **Test Frontend**: Visit your frontend URL and try uploading a video
3. **Check Logs**: If something fails, check the deployment logs

---

## 📝 Quick Reference

### Backend URLs by Platform:
- Railway: `https://your-app.railway.app`
- Render: `https://your-app.onrender.com`
- Heroku: `https://your-app-name.herokuapp.com`

### Frontend URLs by Platform:
- Vercel: `https://your-project.vercel.app`
- Netlify: `https://your-site.netlify.app`

### Environment Variables Needed:

**Backend**: Usually none (Hugging Face Space is public)

**Frontend**: 
- `REACT_APP_API_URL` = Your backend URL (e.g., `https://your-backend.railway.app`)

---

## 🔧 Troubleshooting

### Frontend can't connect to backend
- Check CORS settings in `backend/main.py`
- Verify `REACT_APP_API_URL` is set correctly in frontend environment variables
- Check backend logs for errors

### Backend deployment fails
- Ensure `requirements.txt` includes all dependencies
- Check that Python version is 3.10
- Verify `Procfile` exists and has correct command

### Video upload times out
- The timeout is set to 300 seconds (5 minutes)
- For very large videos, consider implementing chunked uploads
- Check Hugging Face Space logs for processing issues

---

## 🎉 You're Done!

Once deployed, share your frontend URL with others and they can use the app!

The app flow:
1. User uploads video → Frontend
2. Frontend sends to → Backend API
3. Backend sends to → Hugging Face Space
4. Result comes back → Frontend displays it

All three components are now publicly accessible! 🚀

