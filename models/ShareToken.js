const mongoose = require('mongoose');

const shareTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: '24h' }  // Token expires after 24 hours
});

module.exports = mongoose.model('ShareToken', shareTokenSchema);
