const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Resource title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  type: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'link', 'note', 'image', 'other'],
    required: [true, 'Resource type is required']
  },
  content: {
    type: String,
    required: function() {
      return this.type === 'link' || this.type === 'note';
    }
  },
  fileUrl: {
    type: String,
    required: function() {
      return ['pdf', 'doc', 'docx', 'image', 'other'].includes(this.type);
    }
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number
  },
  mimeType: {
    type: String
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'Team reference is required']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader reference is required']
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot be more than 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for better query performance
resourceSchema.index({ team: 1, createdAt: -1 });
resourceSchema.index({ uploadedBy: 1 });
resourceSchema.index({ type: 1 });

// Virtual for like count
resourceSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
resourceSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Method to check if user has liked the resource
resourceSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Method to toggle like
resourceSchema.methods.toggleLike = function(userId) {
  const likeIndex = this.likes.findIndex(like => like.user.toString() === userId.toString());
  
  if (likeIndex > -1) {
    this.likes.splice(likeIndex, 1);
    return false; // unliked
  } else {
    this.likes.push({ user: userId });
    return true; // liked
  }
};

module.exports = mongoose.model('Resource', resourceSchema);
