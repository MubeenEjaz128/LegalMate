const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['client', 'lawyer', 'admin'],
    default: 'client'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  credits: {
    type: Number,
    default: 0
  },
  // Lawyer-specific fields
  specialization: {
    type: String,
    required: function() { return this.role === 'lawyer' }
  },
  barNumber: {
    type: String,
    required: function() { return this.role === 'lawyer' }
  },
  hourlyRate: {
    type: Number,
    required: function() { return this.role === 'lawyer' },
    min: 0
  },
  bio: {
    type: String,
    maxlength: 1000
  },
  languages: [{
    type: String,
    enum: ['English', 'Urdu', 'Punjabi']
  }],
  availability: {
    type: Map,
    of: [{
      startTime: String,
      endTime: String,
      isAvailable: Boolean
    }],
    default: {}
  },
  // Admin-specific fields
  adminLevel: {
    type: String,
    enum: ['super', 'moderator'],
    default: 'moderator'
  }
}, {
  timestamps: true
})

// Index for efficient queries
userSchema.index({ role: 1 })
userSchema.index({ specialization: 1 })

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject()
  delete user.password
  return user
}

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name
})

// Instance method to check if user is lawyer
userSchema.methods.isLawyer = function() {
  return this.role === 'lawyer'
}

// Instance method to check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin'
}

// Static method to find lawyers
userSchema.statics.findLawyers = function(filters = {}) {
  const query = { role: 'lawyer', isActive: true, isVerified: true }
  
  if (filters.specialization) {
    query.specialization = filters.specialization
  }
  
  if (filters.location) {
    query.location = filters.location
  }
  
  if (filters.minRating) {
    // This would need to be implemented with aggregation
    // For now, we'll handle rating filtering in the service layer
  }
  
  return this.find(query)
}

module.exports = mongoose.model('User', userSchema) 