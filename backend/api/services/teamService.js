const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');
const User = require('../models/User');

const getTeams = async () => {
  const teams = await Team.find().sort({ rank: 1 });
  const teamIds = teams.map((t) => t.id);

  const members = await TeamMember.find({ teamId: { $in: teamIds } });
  const studentIds = members.map((m) => m.studentId);
  const users = await User.find({ _id: { $in: studentIds } });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const membersByTeam = new Map();
  members.forEach((m) => {
    const list = membersByTeam.get(m.teamId) || [];
    list.push({
      ...m.toJSON(),
      student: userMap.get(m.studentId) || null
    });
    membersByTeam.set(m.teamId, list);
  });

  return teams.map((t) => ({
    ...t.toJSON(),
    members: membersByTeam.get(t.id) || []
  }));
};

const getTeamById = async (id) => {
  const team = await Team.findById(id);
  if (!team) {
    const error = new Error('Team not found');
    error.statusCode = 404;
    throw error;
  }

  const members = await TeamMember.find({ teamId: team.id });
  const studentIds = members.map((m) => m.studentId);
  const users = await User.find({ _id: { $in: studentIds } });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const enrichedMembers = members.map((m) => ({
    ...m.toJSON(),
    student: userMap.get(m.studentId) || null
  }));

  return {
    ...team.toJSON(),
    members: enrichedMembers
  };
};

const createTeam = async (data) => {
  return Team.create(data);
};

const addOrUpdateMember = async (teamId, studentId, role, contribution) => {
  const member = await TeamMember.findOneAndUpdate(
    { teamId, studentId },
    { teamId, studentId, role, contribution },
    { upsert: true, new: true }
  );
  return member;
};

module.exports = {
  getTeams,
  getTeamById,
  createTeam,
  addOrUpdateMember
};
