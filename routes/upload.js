const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { encryptBuffer, generateKeyIV } = require('../utils/encryption'); // ✅ MISSING earlier
const Document = require('../models/Document');
const verifyToken = require('../middleware/jwtMiddleware');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log("✅ Created 'uploads' directory");
}

const storage = multer.memoryStorage();
const upload = multer({ storage });

// 📁 POST /api/upload (with real encryption)
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });

    // ✅ Encrypt file buffer
    const { key, iv } = generateKeyIV();
    const encrypted = encryptBuffer(req.file.buffer, key, iv);

    // ✅ Save encrypted file
    const filename = `${uuidv4()}${path.extname(req.file.originalname)}`;
    const encryptedPath = path.join(uploadsDir, filename);
    fs.writeFileSync(encryptedPath, encrypted);

    // ✅ Save metadata
    const newDoc = new Document({
      originalName: req.file.originalname,
      encryptedPath,
      key: key.toString('hex'),
      iv: iv.toString('hex'),
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.userId,
    });

    await newDoc.save();
    res.status(200).json({ msg: '✅ File encrypted & uploaded successfully' });

  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: 'Internal error during upload' });
  }
});

module.exports = router;
