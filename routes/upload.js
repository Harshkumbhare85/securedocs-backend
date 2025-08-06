const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
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

router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (!req.user || !req.user.userId) return res.status(401).json({ error: 'Unauthorized' });

    const filename = `${uuidv4()}${path.extname(req.file.originalname)}`;
    const encryptedPath = path.join(uploadsDir, filename);

    // ⛔ No encryption – store raw file for now
    fs.writeFileSync(encryptedPath, req.file.buffer);
    console.log("🟢 Original file size:", req.file.buffer.length);

    const newDoc = new Document({
      originalName: req.file.originalname,
      encryptedPath,
      key: '00', // dummy
      iv: '00',  // dummy
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.userId,
    });

    await newDoc.save();

    res.status(200).json({ msg: 'File uploaded successfully (no encryption)' });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: 'Internal server error during upload' });
  }
});

module.exports = router;
