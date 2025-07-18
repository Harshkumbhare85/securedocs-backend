const express = require('express');
const fs = require('fs');
const path = require('path');
const { decryptBuffer } = require('../utils/encryption');
const Document = require('../models/Document');
const verifyToken = require('../middleware/jwtMiddleware');

const router = express.Router();

// ✅ GET /api/download/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const docId = req.params.id;
    console.log("📥 Download request for document ID:", docId);

    const document = await Document.findById(docId);
    if (!document) {
      console.log("❌ Document not found in DB");
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.uploadedBy.toString() !== req.user.userId) {
      console.log("⛔ Unauthorized download attempt");
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(document.encryptedPath)) {
      console.log("❌ Encrypted file not found on disk:", document.encryptedPath);
      return res.status(404).json({ error: 'Encrypted file missing' });
    }

    const encryptedData = fs.readFileSync(document.encryptedPath);
    const key = Buffer.from(document.key, 'hex');
    const iv = Buffer.from(document.iv, 'hex');

    const decrypted = decryptBuffer(encryptedData, key, iv);

    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(decrypted);

  } catch (err) {
    console.error('❌ Download error:', err);
    res.status(500).json({ error: 'Download failed' });
  }
});

module.exports = router;
