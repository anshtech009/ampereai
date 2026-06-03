const express = require('express');
const router = express.Router();
const BillHistory = require('../models/BillHistory');

// GET all bill history
router.get('/', async (req, res) => {
  try {
    const history = await BillHistory.find().sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add bill history entry
router.post('/', async (req, res) => {
  try {
    const entry = new BillHistory(req.body);
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE bill history entry
router.delete('/:id', async (req, res) => {
  try {
    await BillHistory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;