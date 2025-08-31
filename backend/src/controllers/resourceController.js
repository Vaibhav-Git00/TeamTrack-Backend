const Resource = require('../models/Resource');
const Team = require('../models/Team');
const path = require('path');
const { getFileType } = require('../middleware/upload');

// @desc    Create a new resource
// @route   POST /api/resources
// @access  Private
const createResource = async (req, res) => {
  try {
    const { title, description, type, content, teamId, tags } = req.body;
    const userId = req.user._id;

    // Validation
    if (!title || !type || !content || !teamId) {
      return res.status(400).json({ 
        message: 'Please provide title, type, content, and team ID' 
      });
    }

    // Check if team exists and user has access
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is a member of the team or a mentor monitoring it
    const isMember = team.isMember(userId);
    const isLeader = team.isLeader(userId);
    const isMentor = req.user.role === 'mentor' && team.mentors.includes(userId);

    if (!isMember && !isLeader && !isMentor) {
      return res.status(403).json({ message: 'Access denied to this team' });
    }

    // Create resource
    const resource = await Resource.create({
      title,
      description,
      type,
      content,
      team: teamId,
      uploadedBy: userId,
      tags: tags || []
    });

    // Populate the resource
    const populatedResource = await Resource.findById(resource._id)
      .populate('uploadedBy', 'name email role')
      .populate('team', 'name teamId');

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      resource: populatedResource
    });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get resources for a team
// @route   GET /api/resources/team/:teamId
// @access  Private
const getTeamResources = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 10, type, search } = req.query;

    // Check if team exists and user has access
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check access
    const isMember = team.isMember(userId);
    const isLeader = team.isLeader(userId);
    const isMentor = req.user.role === 'mentor' && team.mentors.includes(userId);

    if (!isMember && !isLeader && !isMentor) {
      return res.status(403).json({ message: 'Access denied to this team' });
    }

    // Build query
    let query = { team: teamId };
    
    if (type) {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Get resources with pagination
    const resources = await Resource.find(query)
      .populate('uploadedBy', 'name email role')
      .populate('team', 'name teamId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Resource.countDocuments(query);

    res.json({
      success: true,
      count: resources.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      resources
    });
  } catch (error) {
    console.error('Get team resources error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Private
const getResource = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const resource = await Resource.findById(id)
      .populate('uploadedBy', 'name email role')
      .populate('team', 'name teamId')
      .populate('comments.user', 'name email role');

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Check if user has access to this resource's team
    const team = await Team.findById(resource.team._id);
    const isMember = team.isMember(userId);
    const isLeader = team.isLeader(userId);
    const isMentor = req.user.role === 'mentor' && team.mentors.includes(userId);

    if (!isMember && !isLeader && !isMentor) {
      return res.status(403).json({ message: 'Access denied to this resource' });
    }

    res.json({
      success: true,
      resource
    });
  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private
const updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, content, tags } = req.body;
    const userId = req.user._id;

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Check if user is the owner or a mentor
    const isMentor = req.user.role === 'mentor';
    const isOwner = resource.uploadedBy.toString() === userId.toString();

    if (!isOwner && !isMentor) {
      return res.status(403).json({ message: 'Not authorized to update this resource' });
    }

    // Update resource
    const updatedResource = await Resource.findByIdAndUpdate(
      id,
      { title, description, content, tags },
      { new: true, runValidators: true }
    )
    .populate('uploadedBy', 'name email role')
    .populate('team', 'name teamId');

    res.json({
      success: true,
      message: 'Resource updated successfully',
      resource: updatedResource
    });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private
const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Check if user is the owner or a mentor
    const isMentor = req.user.role === 'mentor';
    const isOwner = resource.uploadedBy.toString() === userId.toString();

    if (!isOwner && !isMentor) {
      return res.status(403).json({ message: 'Not authorized to delete this resource' });
    }

    await Resource.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle like on resource
// @route   POST /api/resources/:id/like
// @access  Private
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const isLiked = resource.toggleLike(userId);
    await resource.save();

    res.json({
      success: true,
      message: isLiked ? 'Resource liked' : 'Resource unliked',
      isLiked,
      likeCount: resource.likeCount
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add comment to resource
// @route   POST /api/resources/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    resource.comments.push({
      user: userId,
      text
    });

    await resource.save();

    const updatedResource = await Resource.findById(id)
      .populate('comments.user', 'name email role');

    res.json({
      success: true,
      message: 'Comment added successfully',
      comments: updatedResource.comments
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload file resource
// @route   POST /api/resources/upload
// @access  Private
const uploadFileResource = async (req, res) => {
  try {
    const { title, description, teamId, tags } = req.body;
    const userId = req.user._id;

    // Validation
    if (!title || !teamId || !req.file) {
      return res.status(400).json({
        message: 'Please provide title, team ID, and file'
      });
    }

    // Check if team exists and user has access
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is a member of the team or a mentor monitoring it
    const isMember = team.isMember(userId);
    const isLeader = team.isLeader(userId);
    const isMentor = req.user.role === 'mentor' && team.mentors.includes(userId);

    if (!isMember && !isLeader && !isMentor) {
      return res.status(403).json({ message: 'Access denied to this team' });
    }

    // Get file information
    const fileType = getFileType(req.file.mimetype);
    const fileUrl = `/uploads/${req.file.filename}`;

    // Create resource
    const resource = await Resource.create({
      title,
      description,
      type: fileType,
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      team: teamId,
      uploadedBy: userId,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    // Populate the resource
    const populatedResource = await Resource.findById(resource._id)
      .populate('uploadedBy', 'name email role')
      .populate('team', 'name teamId');

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      resource: populatedResource
    });
  } catch (error) {
    console.error('Upload file resource error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create link or note resource
// @route   POST /api/resources/create
// @access  Private
const createLinkOrNote = async (req, res) => {
  try {
    const { title, description, type, content, teamId, tags } = req.body;
    const userId = req.user._id;

    // Validation
    if (!title || !type || !content || !teamId) {
      return res.status(400).json({
        message: 'Please provide title, type, content, and team ID'
      });
    }

    if (!['link', 'note'].includes(type)) {
      return res.status(400).json({ message: 'Type must be link or note' });
    }

    // Check if team exists and user has access
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is a member of the team or a mentor monitoring it
    const isMember = team.isMember(userId);
    const isLeader = team.isLeader(userId);
    const isMentor = req.user.role === 'mentor' && team.mentors.includes(userId);

    if (!isMember && !isLeader && !isMentor) {
      return res.status(403).json({ message: 'Access denied to this team' });
    }

    // Create resource
    const resource = await Resource.create({
      title,
      description,
      type,
      content,
      team: teamId,
      uploadedBy: userId,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    // Populate the resource
    const populatedResource = await Resource.findById(resource._id)
      .populate('uploadedBy', 'name email role')
      .populate('team', 'name teamId');

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      resource: populatedResource
    });
  } catch (error) {
    console.error('Create link/note resource error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createResource,
  getTeamResources,
  getResource,
  updateResource,
  deleteResource,
  toggleLike,
  addComment,
  uploadFileResource,
  createLinkOrNote
};
