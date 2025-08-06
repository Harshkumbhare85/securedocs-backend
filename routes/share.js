const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const DocumentModel = require('../models/Document');
const verifyToken = require('../middleware/jwtMiddleware');
const sgMail = require('../utils/sendgrid'); // ✅ SendGrid SDK
require('dotenv').config();

// ✅ Always use the environment JWT_SECRET securely
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/share/:id', verifyToken, async (req, res) => {
  const { email } = req.body;

  try {
    // 1. Find the document
    const doc = await DocumentModel.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'File not found' });

    // 2. Check permission
    if (doc.uploadedBy.toString() !== req.user.userId)
      return res.status(403).json({ error: 'Unauthorized to share this file' });

    // 3. Generate token valid for 30 minutes
    const token = jwt.sign({ docId: doc._id.toString() }, JWT_SECRET, { expiresIn: '30m' });
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    // 4. Save token to document record
    doc.sharedWith.push({ email, token, expiresAt });
    await doc.save();

    // 5. Generate shareable link
    const link = `https://securedocs-backend.onrender.com/api/shared/${token}`;

    // 6. Send email via SendGrid
    await sgMail.send({
      to: email,
      from: process.env.EMAIL_FROM,
      subject: '🔐 Secure file access granted - SecureDocs AI',
      html: `
        <p>Hello,</p>
        <p>You have been granted access to a secure document.</p>
        <p><a href="${link}" target="_blank">Click here to access the file</a></p>
        <p>This link will expire in 30 minutes for security reasons.</p>
        <br/>
        <p>Regards,<br/>SecureDocs AI Team</p>
      `
    });

    res.json({ msg: `✅ Secure link sent to ${email}`, token });
  } catch (err) {
    console.error('❌ Share Error:', err.message);
    res.status(500).json({ error: 'Server error while sharing file' });
  }
});

module.exports = router;
