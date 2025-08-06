const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
require('dotenv').config();

// ✅ CORS Configuration
const allowedOrigins = [
  'https://securedocs-frontend-xi.vercel.app',
  'https://securedocs.vercel.app', // include if you set a custom domain,
  'https://vercel.com/harshkumbhare85s-projects/securedocs-frontend/2g9PN5HBGaXyQN7og4w6ybLBtzLw',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman or server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('❌ Not allowed by CORS: ' + origin));
    }
  },
  credentials: true, // Allow credentials (cookies, tokens, etc.)
}));

app.use(express.json());

// ✅ Route imports
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const downloadRoutes = require('./routes/download');
const filesRoutes = require('./routes/files');
const sharedDownload = require('./routes/sharedDownload');

// ✅ Route registrations
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/files', filesRoutes);
app.use('/api', sharedDownload);

app.get("/", (req, res) => {
  res.send("✅ SecureDocs AI Backend is running!");
});

// ✅ MongoDB Connection
mongoose.connect('mongodb+srv://harshkumbhare956:secure123@cluster0.gl0bv9e.mongodb.net/securedocs')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});