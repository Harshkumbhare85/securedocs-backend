const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { encryptBuffer, generateKeyIV } = require('../utils/encryption');
const Document = require('../models/Document');
const verifyToken = require('../middleware/jwtMiddleware');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// 📁 Ensure uploads/ folder exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log("✅ Created 'uploads' directory");
}

// 📦 Setup multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 🔐 Protected Route - POST /api/upload
// ✅ FIXED
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {

  console.log("📥 Upload endpoint hit");

  try {
    if (!req.file) {
      console.warn("⚠️ No file received");
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!req.user || !req.user.userId) {
      console.warn("❌ No valid user from token");
      return res.status(401).json({ error: 'Invalid or missing user token' });
    }

    console.log("📁 File received:", req.file.originalname);
    console.log("👤 Uploaded by:", req.user.userId);

    // Encrypt buffer
    const fileBuffer = req.file.buffer;
    const { key, iv } = generateKeyIV();
    const encrypted = encryptBuffer(fileBuffer, key, iv);

    // Save encrypted file
    const filename = uuidv4() + path.extname(req.file.originalname);
    const encryptedPath = path.join(uploadsDir, filename);

    try {
      fs.writeFileSync(encryptedPath, encrypted);
      console.log("✅ File encrypted and saved:", encryptedPath);
    } catch (fsErr) {
      console.error("❌ Failed to write file:", fsErr);
      return res.status(500).json({ error: 'File saving failed' });
    }

    // Save metadata to MongoDB
    const newDoc = new Document({
      originalName: req.file.originalname,
      encryptedPath: encryptedPath,
      key: key.toString('hex'),
      iv: iv.toString('hex'),
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.userId,
    });

    await newDoc.save();
    console.log("✅ File metadata saved to MongoDB");

    res.status(200).json({ msg: 'File uploaded and encrypted successfully' });
  } catch (err) {
    console.error("❌ Upload Error:", err);
    res.status(500).json({ error: 'Upload failed - internal error' });
  }
});

module.exports = router;
