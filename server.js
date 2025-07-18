const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Routes
const authRoutes = require('./routes/auth');
const uploadRoute = require('./routes/upload');
const fileRoutes = require('./routes/files'); // ✅ Only import once!
const shareRoute = require('./routes/share');
const accessRoute = require('./routes/access');



app.use('/api', shareRoute);
app.use('/api', accessRoute);
app.use('/api', authRoutes);
app.use('/api', uploadRoute);
app.use('/api', fileRoutes);
app.use('/api', require('./routes/verifyShare'));
 // ✅ This includes /api/files GET and others

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected');
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
});
