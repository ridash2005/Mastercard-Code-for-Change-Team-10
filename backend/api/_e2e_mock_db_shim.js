// TEMPORARY dev-only shim for a live end-to-end check - not part of the app.
// No real MongoDB available in this sandbox; patches the Mongo boundary so
// register/login/JWT/bcrypt all run for real.
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const StudentProfile = require('./models/StudentProfile');
const AdminProfile = require('./models/AdminProfile');
const AuditLog = require('./models/AuditLog');

const store = new Map();

function makeDoc(fields) {
  const doc = { _id: new mongoose.Types.ObjectId(), ...fields, createdAt: new Date(), updatedAt: new Date() };
  doc.comparePassword = async (candidate) => bcrypt.compare(candidate, doc.passwordHash);
  doc.save = async () => doc;
  doc.toJSON = function () {
    const { passwordHash, ...rest } = doc;
    return { ...rest, id: rest._id.toString() };
  };
  return doc;
}

User.create = async (fields) => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(fields.passwordHash, salt);
  const doc = makeDoc({ ...fields, passwordHash });
  store.set(fields.email, doc);
  return doc;
};
User.findOne = (query) => Promise.resolve(store.get(query.email) || null);
User.findById = (id) => ({
  select: async () => {
    for (const doc of store.values()) if (String(doc._id) === String(id)) return doc;
    return null;
  }
});

StudentProfile.create = async (fields) => ({ ...fields, save: async () => {} });
StudentProfile.findOne = () => Promise.resolve(null);
AdminProfile.create = async (fields) => ({ ...fields });
AdminProfile.findOne = () => Promise.resolve(null);
AuditLog.create = async (doc) => doc;

const app = require('./server.js');
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`E2E shim server listening on ${port}`));
