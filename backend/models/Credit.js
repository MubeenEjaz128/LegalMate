const mongoose = require('mongoose');

const creditSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    required: true,
    default: 1000000 // 1,000,000 credits by default
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Credit', creditSchema);
