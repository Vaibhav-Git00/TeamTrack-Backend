# Team Collaboration & Mentorship Platform

A full-stack MERN application that enables students to form teams, share resources, and receive guidance from mentors.

## 🎯 Problem Statement
Students struggle with team formation, resource sharing, and mentor guidance. This platform provides:
- Easy team creation and joining
- Secure resource sharing within teams
- Mentor oversight and guidance capabilities

## ⚙️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router DOM** - Routing
- **Axios** - HTTP client
- **Lucide React** - Icons

## 🚀 Features

### Authentication
- ✅ Signup/Login for students and mentors
- ✅ Role-based access control
- ✅ JWT-based session management
- ✅ Password hashing with bcrypt

### Student Features
- ✅ Create teams with custom size and description
- ✅ Join teams using unique Team ID
- ✅ Dashboard showing team details and members
- ✅ Upload and share resources within teams
- ✅ Team-specific resource visibility

### Mentor Features
- ✅ Monitor multiple teams
- ✅ View team members and resources
- ✅ Provide feedback and guidance
- ✅ Access to all team activities

## 📁 Project Structure

```
team-collaboration-platform/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/     # JWT auth middleware
│   │   └── server.js       # Entry point
│   ├── .env               # Environment variables
│   └── package.json       # Dependencies
├── frontend/               # React/Vite application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React Context
│   │   ├── utils/         # Utilities
│   │   └── App.jsx        # Main component
│   ├── .env              # Environment variables
│   └── package.json      # Dependencies
└── README.md             # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your MongoDB URI and JWT secret
# Start the server
npm start
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

#### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/team-collaboration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

#### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## 🚀 Running the Application

1. **Start MongoDB** (if using local installation)
2. **Start Backend Server:**
   ```bash
   cd backend && npm start
   ```
3. **Start Frontend Development Server:**
   ```bash
   cd frontend && npm run dev
   ```
4. **Access the application:**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`

## 📊 Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (student/mentor),
  teams: [ObjectId],
  monitoringTeams: [ObjectId]
}
```

### Team Model
```javascript
{
  name: String,
  teamId: String (unique, auto-generated),
  size: Number,
  leader: ObjectId,
  members: [{ user: ObjectId, joinedAt: Date }],
  mentors: [ObjectId],
  description: String,
  isActive: Boolean
}
```

### Resource Model
```javascript
{
  title: String,
  description: String,
  type: String (document/link/note/file),
  content: String,
  team: ObjectId,
  uploadedBy: ObjectId,
  tags: [String],
  likes: [{ user: ObjectId, likedAt: Date }],
  comments: [{ user: ObjectId, text: String, createdAt: Date }]
}
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Teams
- `POST /api/teams` - Create team
- `POST /api/teams/join` - Join team
- `GET /api/teams/my-teams` - Get user's teams
- `GET /api/teams/:id` - Get team details

### Resources
- `POST /api/resources` - Create resource
- `GET /api/resources/team/:teamId` - Get team resources
- `POST /api/resources/:id/like` - Toggle like
- `POST /api/resources/:id/comments` - Add comment

## 🎨 UI Features

### Responsive Design
- Mobile-first approach
- Adaptive layouts
- Touch-friendly interface

### Modern UI Components
- Clean, professional design
- Consistent color scheme
- Intuitive navigation
- Loading states and error handling

### User Experience
- Role-based dashboards
- Real-time feedback
- Form validation
- Success/error notifications

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Protected API routes
- Input validation and sanitization

## 🚀 Deployment

### Backend (Render/Heroku)
1. Create account on hosting platform
2. Connect repository
3. Set environment variables
4. Deploy

### Frontend (Vercel/Netlify)
1. Connect repository
2. Set build command: `npm run build`
3. Set environment variables
4. Deploy

### Database (MongoDB Atlas)
1. Create cluster
2. Get connection string
3. Update MONGODB_URI in environment

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📝 License

<!-- This project is licensed under the MIT License. -->

## 👥 Team

Built with ❤️ for student collaboration and mentorship.

---

<!-- **Ready to collaborate? Start by running the application and creating your first team!** -->
