const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ Routes
const authRoutes = require('./routes/auth');
const uploadRoute = require('./routes/upload');
const fileRoutes = require('./routes/files');
const shareRoute = require('./routes/share');
const accessRoute = require('./routes/access');
const verifyShareRoute = require('./routes/verifyShare');

// ✅ Mount Routes under /api
app.use('/api', authRoutes);         // /api/signup, /api/login
app.use('/api', uploadRoute);        // /api/upload
app.use('/api', fileRoutes);         // /api/files (get, delete, download)
app.use('/api', shareRoute);         // /api/share
app.use('/api', accessRoute);        // /api/access
app.use('/api', verifyShareRoute);   // /api/verify-share

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected');
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});
