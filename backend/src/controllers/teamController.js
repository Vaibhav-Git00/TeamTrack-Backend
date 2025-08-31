const Team = require('../models/Team');
const User = require('../models/User');

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private (Students only)
const createTeam = async (req, res) => {
  try {
    const { name, size, description, group, subject } = req.body;
    const userId = req.user._id;

    // Validation
    if (!name || !size || !group || !subject) {
      return res.status(400).json({ message: 'Please provide team name, size, group, and subject' });
    }

    if (size < 2 || size > 10) {
      return res.status(400).json({ message: 'Team size must be between 2 and 10' });
    }

    // Check if user is already a leader of another team
    const existingTeam = await Team.findOne({ leader: userId, isActive: true });
    if (existingTeam) {
      return res.status(400).json({ message: 'You are already a leader of another team' });
    }

    // Generate unique team ID
    let teamId;
    let isUnique = false;

    while (!isUnique) {
      teamId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existingTeam = await Team.findOne({ teamId });
      if (!existingTeam) {
        isUnique = true;
      }
    }

    // Create team
    const team = await Team.create({
      name,
      teamId,
      group: group.toUpperCase(),
      subject: subject.trim(),
      size,
      description,
      leader: userId,
      members: [{ user: userId }]
    });

    // Add team to user's teams array
    await User.findByIdAndUpdate(userId, {
      $push: { teams: team._id }
    });

    // Populate team data
    const populatedTeam = await Team.findById(team._id)
      .populate('leader', 'name email')
      .populate('members.user', 'name email')
      .populate('mentors', 'name email');

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      team: populatedTeam
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Join a team using team ID
// @route   POST /api/teams/join
// @access  Private (Students only)
const joinTeam = async (req, res) => {
  try {
    const { teamId } = req.body;
    const userId = req.user._id;

    if (!teamId) {
      return res.status(400).json({ message: 'Please provide team ID' });
    }

    // Find team by teamId
    const team = await Team.findOne({ teamId: teamId.toUpperCase(), isActive: true });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if team is full
    if (team.isFull()) {
      return res.status(400).json({ message: 'Team is already full' });
    }

    // Check if user is already a member
    if (team.isMember(userId)) {
      return res.status(400).json({ message: 'You are already a member of this team' });
    }

    // Add user to team
    team.members.push({ user: userId });
    await team.save();

    // Add team to user's teams array
    await User.findByIdAndUpdate(userId, {
      $push: { teams: team._id }
    });

    // Populate and return updated team
    const updatedTeam = await Team.findById(team._id)
      .populate('leader', 'name email')
      .populate('members.user', 'name email')
      .populate('mentors', 'name email');

    res.json({
      success: true,
      message: 'Successfully joined the team',
      team: updatedTeam
    });
  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's teams
// @route   GET /api/teams/my-teams
// @access  Private
const getMyTeams = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let teams;

    if (userRole === 'student') {
      // Get teams where user is a member
      teams = await Team.find({
        $or: [
          { leader: userId },
          { 'members.user': userId }
        ],
        isActive: true
      })
      .populate('leader', 'name email')
      .populate('members.user', 'name email')
      .populate('mentors', 'name email')
      .sort({ createdAt: -1 });
    } else {
      // Get teams that mentor is monitoring
      teams = await Team.find({
        mentors: userId,
        isActive: true
      })
      .populate('leader', 'name email')
      .populate('members.user', 'name email')
      .populate('mentors', 'name email')
      .sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      count: teams.length,
      teams
    });
  } catch (error) {
    console.error('Get my teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get team details
// @route   GET /api/teams/:id
// @access  Private
const getTeamDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await Team.findById(id)
      .populate('leader', 'name email role')
      .populate('members.user', 'name email role')
      .populate('mentors', 'name email role');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json({
      success: true,
      team
    });
  } catch (error) {
    console.error('Get team details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all teams (for mentors)
// @route   GET /api/teams
// @access  Private (Mentors only)
const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find({ isActive: true })
      .populate('leader', 'name email')
      .populate('members.user', 'name email')
      .populate('mentors', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: teams.length,
      teams
    });
  } catch (error) {
    console.error('Get all teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add mentor to team
// @route   POST /api/teams/:id/add-mentor
// @access  Private (Mentors only)
const addMentorToTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const mentorId = req.user._id;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if mentor is already monitoring this team
    if (team.mentors.includes(mentorId)) {
      return res.status(400).json({ message: 'You are already monitoring this team' });
    }

    // Add mentor to team
    team.mentors.push(mentorId);
    await team.save();

    // Add team to mentor's monitoring teams
    await User.findByIdAndUpdate(mentorId, {
      $push: { monitoringTeams: team._id }
    });

    const updatedTeam = await Team.findById(id)
      .populate('leader', 'name email')
      .populate('members.user', 'name email')
      .populate('mentors', 'name email');

    res.json({
      success: true,
      message: 'Successfully started monitoring this team',
      team: updatedTeam
    });
  } catch (error) {
    console.error('Add mentor to team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Leave team
// @route   DELETE /api/teams/:id/leave
// @access  Private (Students only)
const leaveTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is the leader
    if (team.isLeader(userId)) {
      return res.status(400).json({
        message: 'Team leader cannot leave the team. Transfer leadership first or delete the team.'
      });
    }

    // Check if user is a member
    if (!team.isMember(userId)) {
      return res.status(400).json({ message: 'You are not a member of this team' });
    }

    // Remove user from team
    team.members = team.members.filter(member => member.user.toString() !== userId.toString());
    await team.save();

    // Remove team from user's teams
    await User.findByIdAndUpdate(userId, {
      $pull: { teams: team._id }
    });

    res.json({
      success: true,
      message: 'Successfully left the team'
    });
  } catch (error) {
    console.error('Leave team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private (Team Leaders and Members)
const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { name, size, description, subject } = req.body;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is team leader or member
    if (!team.isLeader(userId) && !team.isMember(userId)) {
      return res.status(403).json({ message: 'Access denied. You must be a team leader or member to update this team.' });
    }

    // Validation
    if (name && name.trim().length === 0) {
      return res.status(400).json({ message: 'Team name cannot be empty' });
    }

    if (size && (size < 2 || size > 10)) {
      return res.status(400).json({ message: 'Team size must be between 2 and 10' });
    }

    // If reducing team size, check if current members exceed new size
    if (size && size < team.members.length) {
      return res.status(400).json({
        message: `Cannot reduce team size to ${size}. Current team has ${team.members.length} members.`
      });
    }

    // Update team fields
    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (size) updateFields.size = size;
    if (description !== undefined) updateFields.description = description.trim();
    if (subject) updateFields.subject = subject.trim();

    const updatedTeam = await Team.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('leader', 'name email')
      .populate('members.user', 'name email')
      .populate('mentors', 'name email');

    res.json({
      success: true,
      message: 'Team updated successfully',
      team: updatedTeam
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private (Team Leaders only)
const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is team leader
    if (!team.isLeader(userId)) {
      return res.status(403).json({ message: 'Access denied. Only team leaders can delete the team.' });
    }

    // Remove team from all members' teams array
    const memberIds = team.members.map(member => member.user);
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $pull: { teams: team._id } }
    );

    // Remove team from all mentors' monitoring teams array
    if (team.mentors.length > 0) {
      await User.updateMany(
        { _id: { $in: team.mentors } },
        { $pull: { monitoringTeams: team._id } }
      );
    }

    // Delete the team
    await Team.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get teams by group (for mentors)
// @route   GET /api/teams/group/:groupName
// @access  Private (Mentors only)
const getTeamsByGroup = async (req, res) => {
  try {
    const { groupName } = req.params;

    // Validate group name
    const validGroups = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10'];
    if (!validGroups.includes(groupName.toUpperCase())) {
      return res.status(400).json({ message: 'Invalid group name' });
    }

    const teams = await Team.find({
      group: groupName.toUpperCase(),
      isActive: true
    })
    .populate('leader', 'name email')
    .populate('members.user', 'name email')
    .populate('mentors', 'name email')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      group: groupName.toUpperCase(),
      count: teams.length,
      teams
    });
  } catch (error) {
    console.error('Get teams by group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all available groups with team counts
// @route   GET /api/teams/groups
// @access  Private (Mentors only)
const getGroupsWithCounts = async (req, res) => {
  try {
    const groups = await Team.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$group',
          teamCount: { $sum: 1 },
          totalMembers: { $sum: { $size: '$members' } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const allGroups = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10'];
    const groupsWithCounts = allGroups.map(group => {
      const found = groups.find(g => g._id === group);
      return {
        group,
        teamCount: found ? found.teamCount : 0,
        totalMembers: found ? found.totalMembers : 0
      };
    });

    res.json({
      success: true,
      groups: groupsWithCounts
    });
  } catch (error) {
    console.error('Get groups with counts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
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
};
