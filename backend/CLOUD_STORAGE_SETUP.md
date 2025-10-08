# Cloud Storage Setup for TeamTrack

## 🚨 Current Issue
Files uploaded to Render.com are stored in ephemeral storage and will be lost when the server restarts.

## 🛠️ Solutions

### Option 1: Cloudinary (Recommended - Free Tier Available)

1. **Sign up at [Cloudinary.com](https://cloudinary.com)**
2. **Get your credentials:**
   - Cloud Name
   - API Key
   - API Secret

3. **Install Cloudinary:**
   ```bash
   npm install cloudinary multer-storage-cloudinary
   ```

4. **Update upload middleware:**
   ```javascript
   const cloudinary = require('cloudinary').v2;
   const { CloudinaryStorage } = require('multer-storage-cloudinary');
   
   cloudinary.config({
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
     api_key: process.env.CLOUDINARY_API_KEY,
     api_secret: process.env.CLOUDINARY_API_SECRET
   });
   
   const storage = new CloudinaryStorage({
     cloudinary: cloudinary,
     params: {
       folder: 'teamtrack',
       allowed_formats: ['jpg', 'png', 'pdf', 'doc', 'docx', 'txt']
     }
   });
   ```

### Option 2: AWS S3

1. **Create AWS S3 bucket**
2. **Install AWS SDK:**
   ```bash
   npm install aws-sdk multer-s3
   ```

### Option 3: Temporary Fix - Database Storage

Store small files directly in MongoDB (not recommended for large files).

## 🔧 Environment Variables Needed

Add these to your Render.com environment variables:

```env
# For Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# For AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=your_bucket_name
AWS_REGION=your_region
```

## 📋 Implementation Steps

1. Choose a cloud storage provider
2. Set up account and get credentials
3. Install required packages
4. Update upload middleware
5. Update environment variables
6. Test file uploads
7. Deploy to production

## 💰 Cost Comparison

- **Cloudinary**: Free tier (25GB storage, 25GB bandwidth/month)
- **AWS S3**: Pay-as-you-go (very cheap for small projects)
- **Google Cloud**: Free tier (5GB storage)
- **Azure**: Free tier (5GB storage)

## 🎯 Recommendation

**Use Cloudinary** - it's the easiest to set up and has a generous free tier perfect for your project.
