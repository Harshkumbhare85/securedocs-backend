const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { encryptBuffer, generateKeyIV } = require('../utils/encryption');
const { v4: uuidv4 } = require('uuid');
const Document = require('../models/Document');
const verifyToken = require('../middleware/jwtMiddleware');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const router = express.Router();

// 📁 Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log("✅ Created 'uploads' directory");
}

// ⚙️ Multer setup (memory storage for encryption)
const storage = multer.memoryStorage();
const upload = multer({ storage });


// 🔐 POST /api/upload — Upload and encrypt file
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { buffer, originalname, size, mimetype } = req.file;
    const { key, iv } = generateKeyIV();
    const encrypted = encryptBuffer(buffer, key, iv);

    const filename = uuidv4() + path.extname(originalname);
    const encryptedPath = path.join(uploadsDir, filename);
    fs.writeFileSync(encryptedPath, encrypted);

    const newDoc = new Document({
      originalName: originalname,
      encryptedPath,
      key: key.toString('hex'),
      iv: iv.toString('hex'),
      size,
      mimeType: mimetype,
      uploadedBy: req.user.userId,
      sharedWith: [],
    });

    await newDoc.save();
    res.status(200).json({ msg: '✅ File uploaded and encrypted successfully' });
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});


// 📄 GET /api/files — Fetch user's uploaded files
router.get('/files', verifyToken, async (req, res) => {
  try {
    const files = await Document.find({ uploadedBy: req.user.userId }).sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    console.error('❌ Fetch files error:', err);
    res.status(500).json({ error: 'Server error while fetching files' });
  }
});


// 🗑️ DELETE /api/files/:id — Delete file
router.delete('/files/:id', verifyToken, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'File not found' });
    if (doc.uploadedBy.toString() !== req.user.userId)
      return res.status(403).json({ error: 'Unauthorized' });

    if (fs.existsSync(doc.encryptedPath)) {
      fs.unlinkSync(doc.encryptedPath);
    }

    await doc.deleteOne();
    res.json({ msg: '🗑️ File deleted successfully' });
  } catch (err) {
    console.error('❌ Delete file error:', err);
    res.status(500).json({ error: 'Server error while deleting file' });
  }
});


// 📥 GET /api/files/:id/download — Download file
router.get('/files/:id/download', verifyToken, async (req, res) => {
  try {
    const file = await Document.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    if (file.uploadedBy.toString() !== req.user.userId)
      return res.status(403).json({ error: 'Unauthorized access' });

    if (!fs.existsSync(file.encryptedPath))
      return res.status(404).json({ error: 'File not found on disk' });

    res.download(file.encryptedPath, file.originalName);
  } catch (err) {
    console.error('❌ Download route error:', err);
    res.status(500).json({ error: 'Server error during download' });
  }
});


// 📤 POST /api/share — Share file via email (Gmail)
router.post('/share', verifyToken, async (req, res) => {
  const { fileId, recipientEmail } = req.body;

  try {
    const file = await Document.findById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    const token = jwt.sign({ docId: file._id }, process.env.JWT_SECRET, { expiresIn: '10m' });
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    file.sharedWith.push({ email: recipientEmail, token, expiresAt });
    await file.save();

    const shareLink = `${process.env.REACT_APP_API_URL}/api/files/shared/${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"SecureDocs AI" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: '🔐 A secure document has been shared with you',
      html: `
        <p>You have received a secure file. Click below to download (valid for 10 minutes):</p>
        <a href="${shareLink}" target="_blank">${shareLink}</a>
      `,
    });

    res.status(200).json({ message: '✅ File shared successfully' });
  } catch (err) {
    console.error('❌ Share error:', err);
    res.status(500).json({ message: 'Server error during sharing' });
  }
});


// 📥 GET /api/files/shared/:token — Access shared file
router.get('/files/shared/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const doc = await Document.findById(decoded.docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const sharedEntry = doc.sharedWith.find(entry => entry.token === token);
    if (!sharedEntry) return res.status(403).json({ error: 'Invalid or expired token' });

    if (new Date() > new Date(sharedEntry.expiresAt)) {
      return res.status(403).json({ error: 'Token has expired' });
    }

    if (!fs.existsSync(doc.encryptedPath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.download(doc.encryptedPath, doc.originalName);
  } catch (err) {
    console.error('❌ Shared access error:', err.message);
    res.status(403).json({ error: 'Unauthorized access to shared file' });
  }
});

module.exports = router;
