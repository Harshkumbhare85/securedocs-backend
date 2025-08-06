// ✅ routes/sharedDownload.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { decryptBuffer } = require('../utils/encryption');
const Document = require('../models/Document');
require('dotenv').config();

const router = express.Router();

// 📥 GET /api/shared-download/:token
router.get('/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use ENV JWT_SECRET
    const doc = await Document.findById(decoded.docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const sharedEntry = doc.sharedWith.find(entry => entry.token === token);
    if (!sharedEntry) return res.status(403).json({ error: 'Invalid share token' });

    if (new Date() > new Date(sharedEntry.expiresAt)) {
      return res.status(403).json({ error: 'Link expired' });
    }

    if (!fs.existsSync(doc.encryptedPath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    const encryptedData = fs.readFileSync(doc.encryptedPath);
    const key = Buffer.from(doc.key, 'hex');
    const iv = Buffer.from(doc.iv, 'hex');
    const decrypted = decryptBuffer(encryptedData, key, iv);

    res.setHeader('Content-Disposition', `attachment; filename="${doc.originalName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(decrypted);
  } catch (err) {
    console.error('❌ Shared download error:', err.message);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
