const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'Team reference is required']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender reference is required']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot be more than 1000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'system'],
    default: 'text'
  },
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for better query performance
chatSchema.index({ team: 1, createdAt: -1 });
chatSchema.index({ sender: 1 });

// Virtual for checking if message is read by user
chatSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(read => read.user.toString() === userId.toString());
};

// Method to mark message as read by user
chatSchema.methods.markAsRead = function(userId) {
  if (!this.isReadBy(userId)) {
    this.readBy.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to get team chat messages
chatSchema.statics.getTeamMessages = async function(teamId, limit = 50, skip = 0) {
  return await this.find({ team: teamId })
    .populate('sender', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get unread message count for user in team
chatSchema.statics.getUnreadCount = async function(teamId, userId) {
  return await this.countDocuments({
    team: teamId,
    sender: { $ne: userId },
    'readBy.user': { $ne: userId }
  });
};

module.exports = mongoose.model('Chat', chatSchema);
