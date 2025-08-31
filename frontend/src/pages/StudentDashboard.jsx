import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Upload, Search, BookOpen, Eye } from 'lucide-react';
import api from '../utils/axios';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [createTeamData, setCreateTeamData] = useState({
    name: '',
    size: 4,
    description: '',
    group: 'G1',
    subject: ''
  });
  const [joinTeamData, setJoinTeamData] = useState({
    teamId: ''
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await api.get('/teams/my-teams');
      setTeams(response.data.teams);
    } catch (error) {
      setError('Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/teams', createTeamData);
      setTeams([response.data.team, ...teams]);
      setCreateTeamData({ name: '', size: 4, description: '', group: 'G1', subject: '' });
      setShowCreateTeam(false);
      setSuccess('Team created successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create team');
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/teams/join', joinTeamData);
      setTeams([response.data.team, ...teams]);
      setJoinTeamData({ teamId: '' });
      setShowJoinTeam(false);
      setSuccess('Successfully joined the team!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to join team');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your teams and collaborate with your peers.
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-8 flex flex-wrap gap-4">
          <button
            onClick={() => setShowCreateTeam(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Team
          </button>
          <button
            onClick={() => setShowJoinTeam(true)}
            className="btn btn-outline flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Join Team
          </button>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard key={team._id} team={team} />
          ))}
          
          {teams.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No teams yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a team or joining an existing one.
              </p>
            </div>
          )}
        </div>

        {/* Create Team Modal */}
        {showCreateTeam && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Team</h3>
              <form onSubmit={handleCreateTeam}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Team Name</label>
                    <input
                      type="text"
                      className="input mt-1"
                      value={createTeamData.name}
                      onChange={(e) => setCreateTeamData({...createTeamData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <input
                      type="text"
                      className="input mt-1"
                      placeholder="e.g., AI, Web Development, IoT"
                      value={createTeamData.subject}
                      onChange={(e) => setCreateTeamData({...createTeamData, subject: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Group</label>
                    <select
                      className="input mt-1"
                      value={createTeamData.group}
                      onChange={(e) => setCreateTeamData({...createTeamData, group: e.target.value})}
                    >
                      {['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10'].map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Team Size</label>
                    <select
                      className="input mt-1"
                      value={createTeamData.size}
                      onChange={(e) => setCreateTeamData({...createTeamData, size: parseInt(e.target.value)})}
                    >
                      {[2,3,4,5,6,7,8,9,10].map(size => (
                        <option key={size} value={size}>{size} members</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                    <textarea
                      className="input mt-1"
                      rows={3}
                      value={createTeamData.description}
                      onChange={(e) => setCreateTeamData({...createTeamData, description: e.target.value})}
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateTeam(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Team
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Join Team Modal */}
        {showJoinTeam && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Join Team</h3>
              <form onSubmit={handleJoinTeam}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Team ID</label>
                  <input
                    type="text"
                    className="input mt-1"
                    placeholder="Enter team ID (e.g., ABC123)"
                    value={joinTeamData.teamId}
                    onChange={(e) => setJoinTeamData({teamId: e.target.value.toUpperCase()})}
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Ask your team leader for the team ID
                  </p>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowJoinTeam(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Join Team
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Team Card Component
const TeamCard = ({ team }) => {
  const navigate = useNavigate();

  const handleViewTeam = () => {
    navigate(`/team/${team._id}`);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
          <div className="flex gap-2">
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              {team.group}
            </span>
            <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
              {team.teamId}
            </span>
          </div>
        </div>
        {team.subject && (
          <p className="text-sm font-medium text-blue-600 mt-1">📚 {team.subject}</p>
        )}
        {team.description && (
          <p className="text-sm text-gray-600 mt-1">{team.description}</p>
        )}
      </div>
      <div className="card-content">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {team.members?.length || 0}/{team.size} members
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            Resources
          </span>
        </div>
        <div className="mt-3">
          <p className="text-sm text-gray-600">
            Leader: {team.leader?.name}
          </p>
        </div>
      </div>
      <div className="card-footer">
        <button
          onClick={handleViewTeam}
          className="btn btn-primary text-sm w-full flex items-center justify-center gap-2"
        >
          <Eye className="h-4 w-4" />
          View Team
        </button>
      </div>
    </div>
  );
};

export default StudentDashboard;
