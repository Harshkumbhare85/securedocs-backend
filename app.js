const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
require('dotenv').config();

app.use(cors());
app.use(express.json());

// ✅ Route imports (make sure these paths are correct)
// ✅ CORRECT paths (since you're already inside /backend folder)
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const downloadRoutes = require('./routes/download');
const filesRoutes = require('./routes/files');


// ✅ Route registrations
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/files', filesRoutes);
app.get("/", (req, res) => {
  res.send("SecureDocs AI Backend is running!");
});


// ✅ DB connect
mongoose.connect('mongodb+srv://harshkumbhare956:secure123@cluster0.gl0bv9e.mongodb.net/securedocs')
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB error:', err));

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
