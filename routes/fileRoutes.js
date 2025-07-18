router.post('/files/share', verifyToken, async (req, res) => {
  const { fileId, email } = req.body;
  const userId = req.user.id;

  try {
    // 1. Validate file ownership
    const file = await Document.findById(fileId);
    if (!file || file.owner.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // 2. Generate secure token (optional: with expiration)
    const token = jwt.sign({ fileId }, process.env.JWT_SECRET, { expiresIn: '10m' });

    // 3. Create secure link
    const link = `http://localhost:5000/api/files/shared/${token}`;

    // 4. Send email with link (using nodemailer)
    await sendMail(email, 'SecureDocs File Share', `Click to download: ${link}`);

    res.json({ message: 'File shared successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
