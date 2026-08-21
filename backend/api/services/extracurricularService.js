const Extracurricular = require('../models/Extracurricular');

const getExtracurriculars = async (query = {}) => {
  const filter = {};
  if (query.kind) filter.kind = query.kind;

  return Extracurricular.find(filter).sort({ date: 1 });
};

const getExtracurricularById = async (id) => {
  const item = await Extracurricular.findById(id);
  if (!item) {
    const error = new Error('Extracurricular activity not found');
    error.statusCode = 404;
    throw error;
  }
  return item;
};

const createExtracurricular = async (data) => {
  return Extracurricular.create(data);
};

module.exports = {
  getExtracurriculars,
  getExtracurricularById,
  createExtracurricular
};
