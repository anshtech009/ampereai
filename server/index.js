const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const applianceRoutes = require('./routes/appliances');
const billHistoryRoutes = require('./routes/billHistory');
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
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

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected!');
    app.listen(process.env.PORT || 5000, () => {
      console.log('Server running on port 5000');
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));