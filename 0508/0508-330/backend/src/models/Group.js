const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  color: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Group', groupSchema);