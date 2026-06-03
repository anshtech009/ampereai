const express = require('express');
const router = express.Router();
const Appliance = require('../models/Appliance');

// GET all appliances
router.get('/', async (req, res) => {
  try {
    const appliances = await Appliance.find();
    res.json(appliances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add appliance
router.post('/', async (req, res) => {
  try {
    const appliance = new Appliance(req.body);
    await appliance.save();
    res.status(201).json(appliance);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE appliance
router.delete('/:id', async (req, res) => {
  try {
    await Appliance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appliance deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;