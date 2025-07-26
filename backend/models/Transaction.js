const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  payee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  commission: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'refunded'],
    default: 'pending'
  },
  proof: {
    type: String,
    default: null
  },
  refundRequested: {
    type: Boolean,
    default: false
  },
  refundProof: {
    type: String,
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isDummy: {
    type: Boolean,
    default: true
  },
  stripePaymentIntentId: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema); 