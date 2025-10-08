# TeamTrack Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Create GitHub Repository
1. Go to [GitHub.com](https://github.com)
2. Click **"+"** → **"New repository"**
3. Name: `TeamTrack`
4. Make it **Public**
5. **Don't** add README
6. Click **"Create repository"**

### 2. Push Code to GitHub
```bash
# Update remote URL (replace with your actual repository URL)
git remote set-url origin https://github.com/YOUR_USERNAME/TeamTrack.git

# Push the code
git push -u origin main
```

### 3. Deploy Backend (Render)
1. Go to [Render.com](https://render.com)
2. Connect your GitHub repository
3. Select the `backend` folder
4. Set environment variables:
   - `MONGODB_URI` = your MongoDB connection string
   - `JWT_SECRET` = your JWT secret key
   - `NODE_ENV` = production
5. Deploy

### 4. Deploy Frontend (Vercel)
1. Go to [Vercel.com](https://vercel.com)
2. Connect your GitHub repository
3. Select the `frontend` folder
4. Set environment variable:
   - `VITE_API_URL` = https://your-backend-url.onrender.com/api
5. Deploy

## 🔧 Current Configuration

- **Frontend URL**: https://team-track-frontend.vercel.app/
- **Backend URL**: https://teamtrack-backend-wwo6.onrender.com
- **API Base URL**: https://teamtrack-backend-wwo6.onrender.com/api

## ✅ What's Fixed

1. **CORS Configuration**: Now allows all necessary origins
2. **API URL Configuration**: Frontend uses correct backend URL
3. **Socket Connection**: Real-time features work in production
4. **Authentication Endpoints**: All auth routes properly configured

## 🧪 Testing

After deployment, test:
1. User registration
2. User login
3. Real-time chat
4. Team creation
5. Task management

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify environment variables are set
3. Ensure both frontend and backend are deployed
4. Check CORS configuration matches your URLs
