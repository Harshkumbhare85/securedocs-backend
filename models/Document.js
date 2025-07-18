const mongoose = require('mongoose');

const sharedWithSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

const documentSchema = new mongoose.Schema({
  originalname: String,
  encryptedPath: String,
  mimetype: String,
  size: Number,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  sharedWith: [sharedWithSchema]
});

const DocumentModel = mongoose.model('Document', documentSchema);

module.exports = DocumentModel;
