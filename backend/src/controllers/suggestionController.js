const Suggestion = require('../models/Suggestion');
const Team = require('../models/Team');
const User = require('../models/User');

// @desc    Create a new suggestion
// @route   POST /api/suggestions
// @access  Private (Mentors only)
const createSuggestion = async (req, res) => {
  try {
    const { title, content, teamId, type, priority, targetMembers, isUrgent, expiresAt } = req.body;
    const mentorId = req.user._id;

    // Validation
    if (!title || !content || !teamId) {
      return res.status(400).json({ message: 'Title, content, and team are required' });
    }

    // Check if mentor is monitoring the team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (!team.mentors.includes(mentorId)) {
      return res.status(403).json({ message: 'Access denied. You must be monitoring this team to send suggestions.' });
    }

    // Validate target members if specified
    let validTargetMembers = [];
    if (targetMembers && targetMembers.length > 0) {
      const teamMemberIds = team.members.map(member => member.user.toString());
      validTargetMembers = targetMembers.filter(memberId => teamMemberIds.includes(memberId));
    }

    // Create suggestion
    const suggestion = await Suggestion.create({
      title: title.trim(),
      content: content.trim(),
      team: teamId,
      mentor: mentorId,
      type: type || 'suggestion',
      priority: priority || 'medium',
      targetMembers: validTargetMembers,
      isUrgent: isUrgent || false,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    // Populate the suggestion
    const populatedSuggestion = await Suggestion.findById(suggestion._id)
      .populate('mentor', 'name email')
      .populate('team', 'name teamId')
      .populate('targetMembers', 'name email');

    // Send real-time notification to team members
    if (global.io) {
      global.io.to(`team-${teamId}`).emit('new-suggestion', {
        suggestion: populatedSuggestion,
        notification: {
          id: suggestion._id,
          title: `New ${suggestion.type} from ${populatedSuggestion.mentor.name}`,
          message: suggestion.title,
          type: suggestion.type,
          priority: suggestion.priority,
          isUrgent: suggestion.isUrgent,
          teamName: populatedSuggestion.team.name,
          createdAt: suggestion.createdAt,
          suggestion: populatedSuggestion // Include full suggestion data
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Suggestion created successfully',
      suggestion: populatedSuggestion
    });
  } catch (error) {
    console.error('Create suggestion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get team suggestions
// @route   GET /api/suggestions/team/:teamId
// @access  Private (Team members and mentors)
const getTeamSuggestions = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { status } = req.query;
    const userId = req.user._id;

    // Check if user has access to team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const isMember = team.isMember(userId);
    const isMentor = team.mentors.includes(userId);

    if (!isMember && !isMentor) {
      return res.status(403).json({ message: 'Access denied. You must be a team member or mentor.' });
    }

    const suggestions = await Suggestion.getTeamSuggestions(teamId, status);

    // Filter suggestions based on user role and target members
    const filteredSuggestions = suggestions.filter(suggestion => {
      if (isMentor) return true; // Mentors can see all suggestions
      
      // For team members, show suggestions targeted to them or to all members
      if (suggestion.targetMembers.length === 0) return true; // For all members
      return suggestion.targetMembers.some(member => member._id.toString() === userId.toString());
    });

    res.json({
      success: true,
      suggestions: filteredSuggestions,
      count: filteredSuggestions.length
    });
  } catch (error) {
    console.error('Get team suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's suggestions (across all teams)
// @route   GET /api/suggestions/my-suggestions
// @access  Private (Students only)
const getMySuggestions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status = 'active' } = req.query;

    // Get user's teams
    const user = await User.findById(userId).populate('teams');
    const teamIds = user.teams.map(team => team._id);

    if (teamIds.length === 0) {
      return res.json({
        success: true,
        suggestions: [],
        count: 0
      });
    }

    // Get suggestions for user's teams
    const suggestions = await Suggestion.find({
      team: { $in: teamIds },
      status: status,
      $or: [
        { targetMembers: { $size: 0 } }, // For all members
        { targetMembers: userId } // Specifically targeted to user
      ]
    })
    .populate('mentor', 'name email')
    .populate('team', 'name teamId')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      suggestions,
      count: suggestions.length
    });
  } catch (error) {
    console.error('Get my suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark suggestion as read
// @route   PUT /api/suggestions/:id/read
// @access  Private (Team members)
const markSuggestionAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const suggestion = await Suggestion.findById(id).populate('team');
    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }

    // Check if user has access
    const isMember = suggestion.team.isMember(userId);
    const isMentor = suggestion.team.mentors.includes(userId);

    if (!isMember && !isMentor) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    await suggestion.markAsRead(userId);

    res.json({
      success: true,
      message: 'Suggestion marked as read'
    });
  } catch (error) {
    console.error('Mark suggestion as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Acknowledge suggestion
// @route   PUT /api/suggestions/:id/acknowledge
// @access  Private (Team members)
const acknowledgeSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    const userId = req.user._id;

    const suggestion = await Suggestion.findById(id).populate('team');
    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }

    // Check if user is team member
    if (!suggestion.team.isMember(userId)) {
      return res.status(403).json({ message: 'Access denied. Only team members can acknowledge suggestions.' });
    }

    await suggestion.acknowledge(userId, response);

    res.json({
      success: true,
      message: 'Suggestion acknowledged successfully'
    });
  } catch (error) {
    console.error('Acknowledge suggestion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update suggestion status
// @route   PUT /api/suggestions/:id/status
// @access  Private (Mentors only)
const updateSuggestionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const mentorId = req.user._id;

    const suggestion = await Suggestion.findById(id);
    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }

    // Check if user is the mentor who created the suggestion
    if (suggestion.mentor.toString() !== mentorId.toString()) {
      return res.status(403).json({ message: 'Access denied. Only the mentor who created this suggestion can update its status.' });
    }

    suggestion.status = status;
    await suggestion.save();

    res.json({
      success: true,
      message: 'Suggestion status updated successfully',
      suggestion
    });
  } catch (error) {
    console.error('Update suggestion status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get unread suggestions count
// @route   GET /api/suggestions/unread-count
// @access  Private (Students only)
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's teams
    const user = await User.findById(userId).populate('teams');
    const teamIds = user.teams.map(team => team._id);

    const unreadCount = await Suggestion.getUnreadCount(userId, teamIds);

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createSuggestion,
  getTeamSuggestions,
  getMySuggestions,
  markSuggestionAsRead,
  acknowledgeSuggestion,
  updateSuggestionStatus,
  getUnreadCount
};
