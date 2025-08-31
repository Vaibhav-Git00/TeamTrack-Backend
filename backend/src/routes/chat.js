const express = require('express');
const {
  getTeamMessages,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount,
  deleteMessage
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Chat routes
router.get('/team/:teamId', getTeamMessages);
router.post('/team/:teamId', sendMessage);
router.put('/team/:teamId/read', markMessagesAsRead);
router.get('/team/:teamId/unread-count', getUnreadCount);
router.delete('/:messageId', deleteMessage);

module.exports = router;
