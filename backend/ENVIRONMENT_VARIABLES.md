# Environment Variables for TeamTrack Backend

## Required Environment Variables

Add these to your Render.com environment variables:

### Database
```
MONGODB_URI=mongodb://localhost:27017/team-collaboration
```

### Authentication
```
JWT_SECRET=your_jwt_secret_here
```

### Server Configuration
```
NODE_ENV=production
PORT=5000
```

### Cloudinary Configuration (for file uploads)
```
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## How to Get Cloudinary Credentials

1. **Sign up at [Cloudinary.com](https://cloudinary.com)**
2. **Go to Dashboard**
3. **Copy your credentials:**
   - Cloud Name
   - API Key
   - API Secret

## Setting Environment Variables in Render

1. Go to your Render dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Add each variable with its value
5. Click "Save Changes"
6. Redeploy your service

## Local Development

Create a `.env` file in the backend directory with the same variables for local development.
