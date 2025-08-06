const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { encryptBuffer, generateKeyIV } = require('../utils/encryption');
const Document = require('../models/Document');
const verifyToken = require('../middleware/jwtMiddleware');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// 📁 Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log("✅ Created 'uploads' directory");
}

// 🧠 Use memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 🔐 POST /api/upload — protected route
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Unauthorized: invalid token' });
    }

    // Encrypt file
   // const { key, iv } = generateKeyIV();
    // const encrypted = encryptBuffer(req.file.buffer, key, iv);

    // Generate unique filename and path
    const filename = `${uuidv4()}${path.extname(req.file.originalname)}`;
    const encryptedPath = path.join(uploadsDir, filename);

    // Write encrypted file to disk
    fs.writeFileSync(encryptedPath, encrypted);
  console.log("🟢 Original file size:", req.file.buffer.length);
console.log("🔐 Encrypted file size:", encrypted.length);

    // Save metadata in MongoDB
 /*   const newDoc = new Document({
      originalName: req.file.originalname,
      encryptedPath,
      key: key.toString('hex'),
      iv: iv.toString('hex'),
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.userId,
    });*/
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

    res.status(200).json({ msg: 'File uploaded and encrypted successfully' });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: 'Internal server error during upload' });
  }
});

module.exports = router;
