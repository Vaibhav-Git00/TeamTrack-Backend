const express = require('express');
const {
  createSuggestion,
  getTeamSuggestions,
  getMySuggestions,
  markSuggestionAsRead,
  acknowledgeSuggestion,
  updateSuggestionStatus,
  getUnreadCount
} = require('../controllers/suggestionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Suggestion routes
router.post('/', authorize('mentor'), createSuggestion);
router.get('/team/:teamId', getTeamSuggestions);
router.get('/my-suggestions', authorize('student'), getMySuggestions);
router.get('/unread-count', authorize('student'), getUnreadCount);
router.put('/:id/read', markSuggestionAsRead);
router.put('/:id/acknowledge', authorize('student'), acknowledgeSuggestion);
router.put('/:id/status', authorize('mentor'), updateSuggestionStatus);

module.exports = router;
