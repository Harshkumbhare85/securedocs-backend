const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const DocumentModel = require('../models/Document');
const verifyToken = require('../middleware/jwtMiddleware');
const sgMail = require('../utils/sendgrid'); // ✅ Use SendGrid SDK
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'mysecuredocs_secretkey';

router.post('/share/:id', verifyToken, async (req, res) => {
  const { email } = req.body;

  try {
    // 1. Find document
    const doc = await DocumentModel.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'File not found' });

    // 2. Check authorization
    if (doc.uploadedBy.toString() !== req.user.userId)
      return res.status(403).json({ error: 'Unauthorized to share this file' });

    // 3. Generate share token (valid for 30 min)
    const token = jwt.sign({ docId: doc._id }, JWT_SECRET, { expiresIn: '30m' });
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // 4. Save to sharedWith
    doc.sharedWith.push({ email, token, expiresAt });
    await doc.save();

    // 5. Create link
    const link = `https://securedocs-backend.onrender.com/api/shared/${token}`;

    // 6. Send email via SendGrid
    await sgMail.send({
      to: email,
      from: process.env.EMAIL_FROM,
      subject: '🔐 You have received a secure file',
      html: `
        <p>Hello,</p>
        <p>You have been granted access to a secure document.</p>
        <p><a href="${link}" target="_blank">Click here to access the file</a></p>
        <p>This link will expire in 30 minutes for security.</p>
        <br/>
        <p>Regards,<br/>SecureDocs AI</p>
      `,
    });

    // 7. Done
    res.json({ msg: `✅ Link sent to ${email}`, token });

  } catch (err) {
    console.error('❌ Share Error:', err);
    res.status(500).json({ error: 'Server error while sharing file' });
  }
});

module.exports = router;
