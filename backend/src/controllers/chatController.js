const Chat = require('../models/Chat');
const Team = require('../models/Team');

// @desc    Get team chat messages
// @route   GET /api/chat/team/:teamId
// @access  Private (Team members only)
const getTeamMessages = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    const userId = req.user._id;

    // Check if user is a team member
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (!team.isMember(userId)) {
      return res.status(403).json({ message: 'Access denied. You must be a team member to view chat.' });
    }

    const messages = await Chat.getTeamMessages(teamId, parseInt(limit), parseInt(skip));

    res.json({
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
      count: messages.length
    });
  } catch (error) {
    console.error('Get team messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send a chat message
// @route   POST /api/chat/team/:teamId
// @access  Private (Team members only)
const sendMessage = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { message, messageType = 'text' } = req.body;
    const userId = req.user._id;

    // Validation
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    // Check if user is a team member
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (!team.isMember(userId)) {
      return res.status(403).json({ message: 'Access denied. You must be a team member to send messages.' });
    }

    // Create chat message
    const chatMessage = await Chat.create({
      team: teamId,
      sender: userId,
      message: message.trim(),
      messageType
    });

    // Populate sender info
    const populatedMessage = await Chat.findById(chatMessage._id)
      .populate('sender', 'name email');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      chatMessage: populatedMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/chat/team/:teamId/read
// @access  Private (Team members only)
const markMessagesAsRead = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { messageIds } = req.body;
    const userId = req.user._id;

    // Check if user is a team member
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (!team.isMember(userId)) {
      return res.status(403).json({ message: 'Access denied. You must be a team member.' });
    }

    // Mark messages as read
    if (messageIds && messageIds.length > 0) {
      await Promise.all(
        messageIds.map(async (messageId) => {
          const message = await Chat.findById(messageId);
          if (message && message.team.toString() === teamId) {
            await message.markAsRead(userId);
          }
        })
      );
    } else {
      // Mark all unread messages in team as read
      const unreadMessages = await Chat.find({
        team: teamId,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      });

      await Promise.all(
        unreadMessages.map(message => message.markAsRead(userId))
      );
    }

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get unread message count for team
// @route   GET /api/chat/team/:teamId/unread-count
// @access  Private (Team members only)
const getUnreadCount = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user._id;

    // Check if user is a team member
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (!team.isMember(userId)) {
      return res.status(403).json({ message: 'Access denied. You must be a team member.' });
    }

    const unreadCount = await Chat.getUnreadCount(teamId, userId);

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a chat message
// @route   DELETE /api/chat/:messageId
// @access  Private (Message sender only)
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Chat.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own messages.' });
    }

    await Chat.findByIdAndDelete(messageId);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTeamMessages,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount,
  deleteMessage
};
