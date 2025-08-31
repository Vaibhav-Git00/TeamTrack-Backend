const express = require('express');
const {
  createTask,
  getTeamTasks,
  getMyTasks,
  updateTaskStatus,
  updateTask,
  deleteTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Task CRUD routes
router.post('/', createTask);
router.get('/team/:teamId', getTeamTasks);
router.get('/my-tasks/:teamId', getMyTasks);
router.put('/:id/status', updateTaskStatus);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
