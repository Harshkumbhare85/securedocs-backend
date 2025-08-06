const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Document = require('../models/Document');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET; // ✅ Correctly read from .env

// 📥 GET /api/shared/:token - Validate token and serve the file
router.get('/shared/:token', async (req, res) => {
  const { token } = req.params;

  try {
    // 🔓 Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    const doc = await Document.findById(decoded.docId);

    if (!doc) {
      return res.status(404).json({ error: 'File not found' });
    }

    // ✅ Find the matching shared entry
    const sharedEntry = doc.sharedWith.find(entry => entry.token === token);

    if (!sharedEntry) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // ⏳ Check if token is expired
    if (new Date() > new Date(sharedEntry.expiresAt)) {
      return res.status(403).json({ error: 'Token has expired' });
    }

    // ✅ Authorized - Send file as download
    res.download(doc.encryptedPath, doc.originalName);

  } catch (err) {
    console.error('❌ Shared access error:', err.message);
    res.status(403).json({ error: 'Unauthorized access to shared file' });
  }
});

module.exports = router;
