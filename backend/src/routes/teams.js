const express = require('express');
const {
  createTeam,
  joinTeam,
  getMyTeams,
  getTeamDetails,
  getAllTeams,
  addMentorToTeam,
  leaveTeam,
  updateTeam,
  deleteTeam,
  getTeamsByGroup,
  getGroupsWithCounts
} = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Student routes
router.post('/', authorize('student'), createTeam);
router.post('/join', authorize('student'), joinTeam);
router.put('/:id', updateTeam); // Both students and mentors can update (with different permissions)
router.delete('/:id', deleteTeam); // Only team leaders can delete
router.delete('/:id/leave', authorize('student'), leaveTeam);

// Mentor routes
router.get('/', authorize('mentor'), getAllTeams);
router.get('/groups', authorize('mentor'), getGroupsWithCounts);
router.get('/group/:groupName', authorize('mentor'), getTeamsByGroup);
router.post('/:id/add-mentor', authorize('mentor'), addMentorToTeam);

// Common routes (both students and mentors)
router.get('/my-teams', getMyTeams);
router.get('/:id', getTeamDetails);

module.exports = router;
