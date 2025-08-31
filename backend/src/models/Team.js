const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    maxlength: [100, 'Team name cannot be more than 100 characters']
  },
  teamId: {
    type: String,
    unique: true,
    uppercase: true
  },
  group: {
    type: String,
    required: [true, 'Group is required'],
    enum: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10'],
    uppercase: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [100, 'Subject cannot be more than 100 characters']
  },
  size: {
    type: Number,
    required: [true, 'Team size is required'],
    min: [2, 'Team size must be at least 2'],
    max: [10, 'Team size cannot exceed 10']
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Team leader is required']
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  mentors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate unique team ID before saving
teamSchema.pre('save', async function(next) {
  try {
    if (!this.teamId) {
      let isUnique = false;
      let teamId;

      while (!isUnique) {
        // Generate 6-character alphanumeric ID
        teamId = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Check if this ID already exists
        const existingTeam = await this.constructor.findOne({ teamId });
        if (!existingTeam) {
          isUnique = true;
        }
      }

      this.teamId = teamId;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual for current member count
teamSchema.virtual('currentSize').get(function() {
  return this.members.length;
});

// Virtual for available slots
teamSchema.virtual('availableSlots').get(function() {
  return this.size - this.members.length;
});

// Method to check if team is full
teamSchema.methods.isFull = function() {
  return this.members.length >= this.size;
};

// Method to check if user is a member
teamSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.user.toString() === userId.toString());
};

// Method to check if user is the leader
teamSchema.methods.isLeader = function(userId) {
  return this.leader.toString() === userId.toString();
};

module.exports = mongoose.model('Team', teamSchema);
