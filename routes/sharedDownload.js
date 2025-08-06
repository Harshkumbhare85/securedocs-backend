const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { decryptBuffer } = require('../utils/encryption');
const Document = require('../models/Document');

const router = express.Router();

// ✅ Public route: GET /api/shared-download/:token
router.get('/shared-download/:token', async (req, res) => {
  const { token } = req.params;

  try {
    // 🔐 Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const doc = await Document.findById(decoded.docId);

    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // ✅ Check if token is in sharedWith list and still valid
    const shareEntry = doc.sharedWith.find(entry => entry.token === token);
    if (!shareEntry || new Date() > new Date(shareEntry.expiresAt)) {
      return res.status(403).json({ error: 'Link has expired or is invalid' });
    }

    // 📂 Ensure encrypted file exists
    if (!fs.existsSync(doc.encryptedPath)) {
      return res.status(404).json({ error: 'Encrypted file not found on server' });
    }

    // 🔑 Decryption pre-check
    if (!doc.key || !doc.iv) {
      return res.status(500).json({ error: 'Decryption metadata missing' });
    }

    // 🧾 Read & decrypt
    const encryptedData = fs.readFileSync(doc.encryptedPath);
    const key = Buffer.from(doc.key, 'hex');
    const iv = Buffer.from(doc.iv, 'hex');

    const decrypted = decryptBuffer(encryptedData, key, iv);

    // 📤 Set headers & send file as download
    res.setHeader('Content-Disposition', `attachment; filename="${doc.originalName}"`);
    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.end(decrypted); // ✅ Correct way to send binary data

    console.log(`✅ Shared file "${doc.originalName}" sent successfully.`);

  } catch (err) {
    console.error('❌ Shared download error:', err.message);
    res.status(401).json({ error: 'Invalid or expired token. Please request a new link.' });
  }
});

module.exports = router;
