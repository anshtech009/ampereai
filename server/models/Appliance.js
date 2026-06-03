const mongoose = require('mongoose');

const applianceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  wattage: { type: Number, required: true },
  hoursPerDay: { type: Number, required: true },
  category: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Appliance', applianceSchema);