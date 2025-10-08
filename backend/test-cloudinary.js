// Test script to verify Cloudinary configuration
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

console.log('Testing Cloudinary configuration...');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Test connection
cloudinary.api.ping()
  .then(result => {
    console.log('✅ Cloudinary connection successful!');
    console.log('Status:', result.status);
    console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
  })
  .catch(error => {
    console.log('❌ Cloudinary connection failed!');
    console.log('Error:', error.message);
    console.log('Make sure to set the following environment variables:');
    console.log('- CLOUDINARY_CLOUD_NAME');
    console.log('- CLOUDINARY_API_KEY');
    console.log('- CLOUDINARY_API_SECRET');
  });
