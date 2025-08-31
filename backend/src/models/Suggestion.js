const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Suggestion title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Suggestion content is required'],
    trim: true,
    maxlength: [2000, 'Content cannot be more than 2000 characters']
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'Team reference is required']
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Mentor reference is required']
  },
  type: {
    type: String,
    enum: ['suggestion', 'feedback', 'improvement', 'warning', 'praise'],
    default: 'suggestion'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'dismissed'],
    default: 'active'
  },
  targetMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }], // If empty, suggestion is for all team members
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  acknowledgedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    acknowledgedAt: {
      type: Date,
      default: Date.now
    },
    response: {
      type: String,
      maxlength: [500, 'Response cannot be more than 500 characters']
    }
  }],
  isUrgent: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
suggestionSchema.index({ team: 1, createdAt: -1 });
suggestionSchema.index({ mentor: 1 });
suggestionSchema.index({ status: 1 });
suggestionSchema.index({ priority: 1 });

// Virtual for checking if suggestion is read by user
suggestionSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(read => read.user.toString() === userId.toString());
};

// Virtual for checking if suggestion is acknowledged by user
suggestionSchema.methods.isAcknowledgedBy = function(userId) {
  return this.acknowledgedBy.some(ack => ack.user.toString() === userId.toString());
};

// Method to mark suggestion as read by user
suggestionSchema.methods.markAsRead = function(userId) {
  if (!this.isReadBy(userId)) {
    this.readBy.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to acknowledge suggestion
suggestionSchema.methods.acknowledge = function(userId, response = '') {
  if (!this.isAcknowledgedBy(userId)) {
    this.acknowledgedBy.push({ 
      user: userId, 
      response: response.trim() 
    });
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to get team suggestions
suggestionSchema.statics.getTeamSuggestions = async function(teamId, status = null) {
  const query = { team: teamId };
  if (status) {
    query.status = status;
  }
  
  return await this.find(query)
    .populate('mentor', 'name email')
    .populate('targetMembers', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get unread suggestions count for user
suggestionSchema.statics.getUnreadCount = async function(userId, teamIds = []) {
  const query = {
    'readBy.user': { $ne: userId },
    status: 'active'
  };
  
  if (teamIds.length > 0) {
    query.team = { $in: teamIds };
  }
  
  return await this.countDocuments(query);
};

// Static method to get mentor's suggestions
suggestionSchema.statics.getMentorSuggestions = async function(mentorId) {
  return await this.find({ mentor: mentorId })
    .populate('team', 'name teamId')
    .populate('targetMembers', 'name email')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Suggestion', suggestionSchema);
