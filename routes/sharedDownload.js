const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { decryptBuffer } = require('../utils/encryption');
const Document = require('../models/Document');

const router = express.Router();

// Public route: GET /api/shared-download/:token
router.get('/shared-download/:token', async (req, res) => {
  const { token } = req.params;

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const doc = await Document.findById(decoded.docId);
    if (!doc) return res.status(404).json({ error: 'File not found' });

    const shareEntry = doc.sharedWith.find(entry => entry.token === token);
    if (!shareEntry || new Date() > shareEntry.expiresAt) {
      return res.status(403).json({ error: 'Link expired or invalid' });
    }

    if (!fs.existsSync(doc.encryptedPath)) {
      return res.status(404).json({ error: 'Encrypted file missing on server' });
    }

    const encryptedData = fs.readFileSync(doc.encryptedPath);
    const key = Buffer.from(doc.key, 'hex');
    const iv = Buffer.from(doc.iv, 'hex');

    const decrypted = decryptBuffer(encryptedData, key, iv);

    res.setHeader('Content-Disposition', `attachment; filename="${doc.originalName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(decrypted);

  } catch (err) {
    console.error('❌ Shared download error:', err);
    res.status(401).json({ error: 'Unauthorized access to shared file' });
  }
});

module.exports = router;
