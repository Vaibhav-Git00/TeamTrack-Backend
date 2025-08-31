const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/database');
const User = require('./models/User');
const Team = require('./models/Team');
const Chat = require('./models/Chat');
const Suggestion = require('./models/Suggestion');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (uploaded files)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/suggestions', require('./routes/suggestions'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running successfully!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User ${socket.user.name} connected`);

  // Join team rooms
  socket.on('join-team', async (teamId) => {
    try {
      const team = await Team.findById(teamId);
      if (team && team.isMember(socket.userId)) {
        socket.join(`team-${teamId}`);
        console.log(`User ${socket.user.name} joined team ${teamId}`);
      }
    } catch (error) {
      console.error('Join team error:', error);
    }
  });

  // Leave team rooms
  socket.on('leave-team', (teamId) => {
    socket.leave(`team-${teamId}`);
    console.log(`User ${socket.user.name} left team ${teamId}`);
  });

  // Handle new chat messages
  socket.on('send-message', async (data) => {
    try {
      const { teamId, message } = data;

      // Verify user is team member
      const team = await Team.findById(teamId);
      if (!team || !team.isMember(socket.userId)) {
        return;
      }

      // Create chat message
      const chatMessage = await Chat.create({
        team: teamId,
        sender: socket.userId,
        message: message.trim(),
        messageType: 'text'
      });

      // Populate sender info
      const populatedMessage = await Chat.findById(chatMessage._id)
        .populate('sender', 'name email');

      // Broadcast to team members
      io.to(`team-${teamId}`).emit('new-message', populatedMessage);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('message-error', { error: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { teamId, isTyping } = data;
    socket.to(`team-${teamId}`).emit('user-typing', {
      userId: socket.userId,
      userName: socket.user.name,
      isTyping
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User ${socket.user.name} disconnected`);
  });
});

// Make io available globally for other modules
global.io = io;

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, server, io };
