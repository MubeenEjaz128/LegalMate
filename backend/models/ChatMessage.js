const mongoose = require('mongoose')

const chatMessageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Not required for group messages
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  attachmentUrl: {
    type: String,
    default: null
  },
  attachmentName: {
    type: String,
    default: null
  },
  attachmentType: {
    type: String,
    default: null
  },
  isGroup: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Index for efficient querying
chatMessageSchema.index({ conversationId: 1, timestamp: 1 })
chatMessageSchema.index({ from: 1, to: 1 })

module.exports = mongoose.model('ChatMessage', chatMessageSchema) 