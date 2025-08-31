# Team Collaboration & Mentorship Platform - Backend

## Overview
This is the backend API for the Team Collaboration & Mentorship Platform built with Node.js, Express.js, and MongoDB.

## Features
- User authentication (JWT-based)
- Role-based access control (Students & Mentors)
- Team management (Create, Join, Monitor)
- Resource sharing within teams
- Real-time collaboration features

## Tech Stack
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables

## Project Structure
```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Team.js              # Team model
│   │   └── Resource.js          # Resource model
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── teams.js             # Team management routes
│   │   └── resources.js         # Resource management routes
│   ├── controllers/
│   │   ├── authController.js    # Auth business logic
│   │   ├── teamController.js    # Team business logic
│   │   └── resourceController.js # Resource business logic
│   ├── middleware/
│   │   └── auth.js              # JWT middleware
│   └── server.js                # Entry point
├── .env                         # Environment variables
├── .env.example                 # Environment template
└── package.json                 # Dependencies
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Steps
1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup:**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/team-collaboration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   NODE_ENV=development
   ```

3. **Start MongoDB:**
   - Local: `mongod`
   - Or use MongoDB Atlas cloud database

4. **Run the server:**
   ```bash
   # Development mode with nodemon
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Verify installation:**
   Visit `http://localhost:5000/api/health` - should return success message

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Teams
- `POST /api/teams` - Create team (Students only)
- `POST /api/teams/join` - Join team (Students only)
- `GET /api/teams/my-teams` - Get user's teams
- `GET /api/teams/:id` - Get team details
- `GET /api/teams` - Get all teams (Mentors only)
- `POST /api/teams/:id/add-mentor` - Add mentor to team
- `DELETE /api/teams/:id/leave` - Leave team

### Resources
- `POST /api/resources` - Create resource
- `GET /api/resources/team/:teamId` - Get team resources
- `GET /api/resources/:id` - Get single resource
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource
- `POST /api/resources/:id/like` - Toggle like
- `POST /api/resources/:id/comments` - Add comment

## Database Models

### User
- name, email, password, role (student/mentor)
- teams (array of team references)
- monitoringTeams (for mentors)

### Team
- name, teamId (unique), size, leader, members
- mentors (array of mentor references)
- description, isActive

### Resource
- title, description, type, content
- team, uploadedBy, tags
- likes, comments

## Environment Variables
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - Token expiration time
- `NODE_ENV` - Environment (development/production)

## Development
- Use `npm run dev` for development with auto-restart
- MongoDB must be running
- Check logs for any connection issues

## Deployment
1. Set environment variables on your hosting platform
2. Ensure MongoDB is accessible
3. Run `npm start`
4. Configure CORS for your frontend domain
