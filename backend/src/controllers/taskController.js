const Task = require('../models/Task');
const Team = require('../models/Team');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Team Leaders only)
const createTask = async (req, res) => {
  try {
    const { title, description, teamId, assignedTo, priority, dueDate, notes } = req.body;
    const userId = req.user._id;

    // Validation
    if (!title || !description || !teamId || !assignedTo) {
      return res.status(400).json({ 
        message: 'Please provide title, description, team, and assigned user' 
      });
    }

    // Check if team exists and user is the leader
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (!team.isLeader(userId)) {
      return res.status(403).json({ message: 'Only team leaders can create tasks' });
    }

    // Check if assigned user is a team member
    if (!team.isMember(assignedTo) && !team.isLeader(assignedTo)) {
      return res.status(400).json({ message: 'Can only assign tasks to team members' });
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      team: teamId,
      assignedTo,
      assignedBy: userId,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes
    });

    // Populate the task
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('team', 'name teamId');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: populatedTask
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get tasks for a team
// @route   GET /api/tasks/team/:teamId
// @access  Private (Team members and mentors)
const getTeamTasks = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Check if team exists and user has access
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check access
    const isMember = team.isMember(userId);
    const isLeader = team.isLeader(userId);
    const isMentor = userRole === 'mentor' && team.mentors.includes(userId);

    if (!isMember && !isLeader && !isMentor) {
      return res.status(403).json({ message: 'Access denied to this team' });
    }

    // Get tasks
    const tasks = await Task.find({ team: teamId })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    // Get team progress
    const progress = await Task.getTeamProgress(teamId);

    res.json({
      success: true,
      tasks,
      progress
    });
  } catch (error) {
    console.error('Get team tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's tasks in a team
// @route   GET /api/tasks/my-tasks/:teamId
// @access  Private
const getMyTasks = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user._id;

    // Check if team exists and user is a member
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (!team.isMember(userId) && !team.isLeader(userId)) {
      return res.status(403).json({ message: 'Access denied to this team' });
    }

    // Get user's tasks
    const tasks = await Task.getUserTasksInTeam(teamId, userId);

    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update task status
// @route   PUT /api/tasks/:id/status
// @access  Private
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    if (!['pending', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const task = await Task.findById(id).populate('team');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user can update this task
    const isAssignedUser = task.assignedTo.toString() === userId.toString();
    const isTeamLeader = task.team.isLeader(userId);

    if (!isAssignedUser && !isTeamLeader) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    // Update task
    task.status = status;
    if (status === 'completed') {
      task.completedAt = new Date();
    } else {
      task.completedAt = undefined;
    }

    await task.save();

    const updatedTask = await Task.findById(id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    res.json({
      success: true,
      message: 'Task status updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private (Team Leaders only)
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assignedTo, priority, dueDate, notes } = req.body;
    const userId = req.user._id;

    const task = await Task.findById(id).populate('team');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is team leader
    if (!task.team.isLeader(userId)) {
      return res.status(403).json({ message: 'Only team leaders can update task details' });
    }

    // If assignedTo is being changed, check if new user is team member
    if (assignedTo && assignedTo !== task.assignedTo.toString()) {
      if (!task.team.isMember(assignedTo) && !task.team.isLeader(assignedTo)) {
        return res.status(400).json({ message: 'Can only assign tasks to team members' });
      }
    }

    // Update task
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      {
        title: title || task.title,
        description: description || task.description,
        assignedTo: assignedTo || task.assignedTo,
        priority: priority || task.priority,
        dueDate: dueDate ? new Date(dueDate) : task.dueDate,
        notes: notes !== undefined ? notes : task.notes
      },
      { new: true, runValidators: true }
    )
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email');

    res.json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Team Leaders only)
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const task = await Task.findById(id).populate('team');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is team leader
    if (!task.team.isLeader(userId)) {
      return res.status(403).json({ message: 'Only team leaders can delete tasks' });
    }

    await Task.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createTask,
  getTeamTasks,
  getMyTasks,
  updateTaskStatus,
  updateTask,
  deleteTask
};
