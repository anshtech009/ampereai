const mongoose = require('mongoose');

const billHistorySchema = new mongoose.Schema({
  month: { type: String, required: true },
  units: { type: Number, required: true },
  bill: { type: Number, required: true },
  state: { type: String, default: 'odisha' },
}, { timestamps: true });

module.exports = mongoose.model('BillHistory', billHistorySchema);