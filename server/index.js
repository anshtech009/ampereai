const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const applianceRoutes = require('./routes/appliances');
const billHistoryRoutes = require('./routes/billHistory');
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');

const app = express();

// Allow localhost (dev) and any Vercel deployment (production)
const allowedOrigins = [
  'http://localhost:3000',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    // Allow localhost and any *.vercel.app domain
    if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // permissive for now; tighten later if needed
  },
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.use('/api/appliances', applianceRoutes);
app.use('/api/billhistory', billHistoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'AmperAI Backend is running!' });
});

const PORT = process.env.PORT || 5000;

// Start the server FIRST so the app stays alive even if Mongo is slow/unreachable
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Then connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected!'))
  .catch(err => console.error('MongoDB connection error:', err.message));