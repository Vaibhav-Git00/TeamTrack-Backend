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

// Socket.io setup with improved configuration
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
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

// Track online users
const onlineUsers = new Map(); // userId -> { user, socketId, teams: Set() }

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`✅ User ${socket.user.name} (${socket.user.role}) connected`);

  // Add user to online users
  onlineUsers.set(socket.userId, {
    user: socket.user,
    socketId: socket.id,
    teams: new Set()
  });

  // Join team rooms
  socket.on('join-team', async (teamId) => {
    try {
      const team = await Team.findById(teamId)
        .populate('leader', 'name email')
        .populate('members.user', 'name email')
        .populate('mentors', 'name email');

      if (!team) {
        console.log(`❌ Team ${teamId} not found`);
        return;
      }

      // Check if user is team member, leader, or mentor
      const isLeader = team.leader && team.leader._id.toString() === socket.userId;
      const isMember = team.members.some(member => member.user._id.toString() === socket.userId);
      const isMentor = team.mentors.some(mentor => mentor._id.toString() === socket.userId);

      if (isLeader || isMember || isMentor) {
        socket.join(`team-${teamId}`);
        console.log(`🔗 User ${socket.user.name} joined team room: team-${teamId}`);

        // Add team to user's joined teams
        if (onlineUsers.has(socket.userId)) {
          onlineUsers.get(socket.userId).teams.add(teamId);
        }

        // Broadcast online status to team members
        const onlineTeamMembers = [];
        const onlineMentors = [];

        // Check which team members are online (including leader)
        if (team.leader && onlineUsers.has(team.leader._id.toString())) {
          onlineTeamMembers.push({
            _id: team.leader._id,
            name: team.leader.name,
            email: team.leader.email,
            isOnline: true,
            isLeader: true
          });
        }

        team.members.forEach(member => {
          if (onlineUsers.has(member.user._id.toString())) {
            onlineTeamMembers.push({
              _id: member.user._id,
              name: member.user.name,
              email: member.user.email,
              isOnline: true,
              isLeader: false
            });
          }
        });

        // Check which mentors are online
        team.mentors.forEach(mentor => {
          if (onlineUsers.has(mentor._id.toString())) {
            onlineMentors.push({
              _id: mentor._id,
              name: mentor.name,
              email: mentor.email,
              isOnline: true
            });
          }
        });

        // Broadcast online status update to all team members
        io.to(`team-${teamId}`).emit('online-status-update', {
          teamId,
          onlineMembers: onlineTeamMembers,
          onlineMentors: onlineMentors,
          userJoined: {
            _id: socket.user._id,
            name: socket.user.name,
            role: socket.user.role
          }
        });

      } else {
        console.log(`❌ User ${socket.user.name} denied access to team ${teamId} - not a member, leader, or mentor`);
      }
    } catch (error) {
      console.error('❌ Join team error:', error);
    }
  });

  // Leave team rooms
  socket.on('leave-team', async (teamId) => {
    socket.leave(`team-${teamId}`);
    console.log(`User ${socket.user.name} left team ${teamId}`);

    // Remove team from user's joined teams
    if (onlineUsers.has(socket.userId)) {
      onlineUsers.get(socket.userId).teams.delete(teamId);
    }

    // Broadcast user left to remaining team members
    socket.to(`team-${teamId}`).emit('online-status-update', {
      teamId,
      userLeft: {
        _id: socket.user._id,
        name: socket.user.name,
        role: socket.user.role
      }
    });
  });

  // Handle new chat messages
  socket.on('send-message', async (data) => {
    try {
      const { teamId, message } = data;
      console.log(`💬 Processing message from ${socket.user.name} to team ${teamId}`);

      // Verify user is team member, leader, or mentor
      const team = await Team.findById(teamId);
      if (!team) {
        console.log(`❌ Team ${teamId} not found`);
        socket.emit('message-error', { error: 'Team not found' });
        return;
      }

      const isLeader = team.leader && team.leader.toString() === socket.userId;
      const isMember = team.members.some(member => member.user.toString() === socket.userId);
      const isMentor = team.mentors.some(mentor => mentor.toString() === socket.userId);

      if (!isLeader && !isMember && !isMentor) {
        console.log(`❌ User ${socket.user.name} not authorized for team ${teamId}`);
        socket.emit('message-error', { error: 'Not authorized to send messages to this team' });
        return;
      }

      // Create chat message
      const chatMessage = await Chat.create({
        team: teamId,
        sender: socket.userId,
        message: message.trim(),
        messageType: 'text',
        readBy: [], // Initialize empty read receipts
        isEdited: false
      });

      // Populate sender info
      const populatedMessage = await Chat.findById(chatMessage._id)
        .populate('sender', 'name email')
        .populate('readBy.user', 'name email');

      console.log(`📤 Broadcasting message to team-${teamId}:`, populatedMessage.message);

      // Broadcast to team members (including sender for confirmation)
      io.to(`team-${teamId}`).emit('new-message', populatedMessage);

      console.log(`✅ Message sent successfully to team-${teamId}`);
    } catch (error) {
      console.error('❌ Send message error:', error);
      socket.emit('message-error', { error: 'Failed to send message' });
    }
  });

  // Handle message read receipts
  socket.on('mark-message-read', async (data) => {
    try {
      const { messageId, teamId } = data;

      // Verify user is team member, leader, or mentor
      const team = await Team.findById(teamId);
      if (!team) {
        return;
      }

      const isLeader = team.leader && team.leader.toString() === socket.userId;
      const isMember = team.members.some(member => member.user.toString() === socket.userId);
      const isMentor = team.mentors.some(mentor => mentor.toString() === socket.userId);

      if (!isLeader && !isMember && !isMentor) {
        return;
      }

      // Update message with read receipt
      const message = await Chat.findById(messageId);
      if (message && !message.readBy.some(read => read.user.toString() === socket.userId)) {
        message.readBy.push({
          user: socket.userId,
          readAt: new Date()
        });
        await message.save();

        // Broadcast read receipt to team members
        socket.to(`team-${teamId}`).emit('message-read', {
          messageId,
          readBy: {
            user: socket.user._id,
            name: socket.user.name,
            readAt: new Date()
          }
        });
      }
    } catch (error) {
      console.error('❌ Mark message read error:', error);
    }
  });

  // Handle message editing
  socket.on('edit-message', async (data) => {
    try {
      const { messageId, newMessage, teamId } = data;

      // Verify user is team member and message owner
      const message = await Chat.findById(messageId);
      if (!message || message.sender.toString() !== socket.userId) {
        socket.emit('message-error', { error: 'Not authorized to edit this message' });
        return;
      }

      // Update message
      message.message = newMessage.trim();
      message.isEdited = true;
      message.editedAt = new Date();
      await message.save();

      // Populate and broadcast updated message
      const populatedMessage = await Chat.findById(messageId)
        .populate('sender', 'name email')
        .populate('readBy.user', 'name email');

      io.to(`team-${teamId}`).emit('message-edited', populatedMessage);

      console.log(`✏️ Message edited by ${socket.user.name}`);
    } catch (error) {
      console.error('❌ Edit message error:', error);
      socket.emit('message-error', { error: 'Failed to edit message' });
    }
  });

  // Handle message deletion
  socket.on('delete-message', async (data) => {
    try {
      const { messageId, teamId } = data;

      // Verify user is team member and message owner
      const message = await Chat.findById(messageId);
      if (!message || message.sender.toString() !== socket.userId) {
        socket.emit('message-error', { error: 'Not authorized to delete this message' });
        return;
      }

      // Delete message
      await Chat.findByIdAndDelete(messageId);

      // Broadcast message deletion
      io.to(`team-${teamId}`).emit('message-deleted', { messageId });

      console.log(`🗑️ Message deleted by ${socket.user.name}`);
    } catch (error) {
      console.error('❌ Delete message error:', error);
      socket.emit('message-error', { error: 'Failed to delete message' });
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
  socket.on('disconnect', async () => {
    console.log(`User ${socket.user.name} disconnected`);

    // Get user's joined teams before removing from online users
    const userTeams = onlineUsers.has(socket.userId) ?
      Array.from(onlineUsers.get(socket.userId).teams) : [];

    // Remove user from online users
    onlineUsers.delete(socket.userId);

    // Broadcast offline status to all teams the user was in
    for (const teamId of userTeams) {
      socket.to(`team-${teamId}`).emit('online-status-update', {
        teamId,
        userLeft: {
          _id: socket.user._id,
          name: socket.user.name,
          role: socket.user.role
        }
      });
    }
  });
});

// Make io available globally for other modules
global.io = io;

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, server, io };
