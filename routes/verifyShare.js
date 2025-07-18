const express = require('express');
const jwt = require('jsonwebtoken');
const Document = require('../models/Document');
const router = express.Router();

router.get('/verify-share/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const doc = await Document.findById(decoded.docId);

    if (!doc) return res.status(404).json({ error: 'File not found' });

    const shareEntry = doc.sharedWith.find(entry => entry.token === token);
    if (!shareEntry || new Date() > shareEntry.expiresAt) {
      return res.status(403).json({ error: 'Link expired or invalid' });
    }

    // ✅ Send download link
    res.json({
      fileName: doc.originalName,
      downloadUrl: `http://${req.hostname}:5000/api/documents/${doc._id}/download`,
    });

  } catch (err) {
    res.status(400).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
