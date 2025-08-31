#!/bin/bash

echo "🚀 Setting up Team Collaboration & Mentorship Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running (optional check)
echo "📦 Installing dependencies..."

# Setup Backend
echo "🔧 Setting up backend..."
cd backend
npm install
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created backend .env file. Please update with your MongoDB URI and JWT secret."
fi
cd ..

# Setup Frontend
echo "🎨 Setting up frontend..."
cd frontend
npm install
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created frontend .env file."
fi
cd ..

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update backend/.env with your MongoDB URI and JWT secret"
echo "2. Start MongoDB (if using local installation)"
echo "3. Run 'cd backend && npm start' to start the backend server"
echo "4. Run 'cd frontend && npm run dev' to start the frontend"
echo ""
echo "🌐 Access the application at http://localhost:3000"
echo "🔗 Backend API will be available at http://localhost:5000"
