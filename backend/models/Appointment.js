const mongoose = require('mongoose')

const appointmentSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 60, // minutes
    min: 15,
    max: 240
  },
  consultationType: {
    type: String,
    enum: ['video', 'chat'],
    default: 'video'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  // Consultation details
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  // Payment details
  amount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  // Session details
  sessionId: {
    type: String,
    unique: true,
    sparse: true
  },
  // Feedback
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 500
    },
    submittedAt: {
      type: Date
    }
  },
  // Cancellation details
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: {
    type: String,
    maxlength: 200
  },
  cancelledAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Indexes for efficient queries
appointmentSchema.index({ client: 1, date: -1 })
appointmentSchema.index({ lawyer: 1, date: -1 })
appointmentSchema.index({ status: 1 })
appointmentSchema.index({ date: 1, time: 1 })

// Virtual for formatted date
appointmentSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// Virtual for formatted time
appointmentSchema.virtual('formattedTime').get(function() {
  return this.time
})

// Virtual for appointment status
appointmentSchema.virtual('isUpcoming').get(function() {
  const now = new Date()
  const appointmentDateTime = new Date(this.date)
  appointmentDateTime.setHours(parseInt(this.time.split(':')[0]))
  appointmentDateTime.setMinutes(parseInt(this.time.split(':')[1]))
  
  return appointmentDateTime > now && this.status === 'confirmed'
})

// Virtual for appointment duration in hours
appointmentSchema.virtual('durationHours').get(function() {
  return this.duration / 60
})

// Instance method to check if appointment can be cancelled
appointmentSchema.methods.canBeCancelled = function() {
  const now = new Date()
  const appointmentDateTime = new Date(this.date)
  appointmentDateTime.setHours(parseInt(this.time.split(':')[0]))
  appointmentDateTime.setMinutes(parseInt(this.time.split(':')[1]))
  
  // Can cancel if appointment is more than 24 hours away
  const hoursUntilAppointment = (appointmentDateTime - now) / (1000 * 60 * 60)
  return hoursUntilAppointment > 24 && this.status === 'confirmed'
}

// Instance method to cancel appointment
appointmentSchema.methods.cancel = function(cancelledBy, reason) {
  this.status = 'cancelled'
  this.cancelledBy = cancelledBy
  this.cancellationReason = reason
  this.cancelledAt = new Date()
  return this.save()
}

// Instance method to complete appointment
appointmentSchema.methods.complete = function() {
  this.status = 'completed'
  this.endTime = new Date()
  return this.save()
}

// Static method to find upcoming appointments
appointmentSchema.statics.findUpcoming = function(userId, role = 'client') {
  const query = {
    status: 'confirmed',
    date: { $gte: new Date() }
  }
  
  if (role === 'client') {
    query.client = userId
  } else if (role === 'lawyer') {
    query.lawyer = userId
  }
  
  return this.find(query)
    .populate('client', 'name email phone')
    .populate('lawyer', 'name email specialization')
    .sort({ date: 1, time: 1 })
}

// Static method to find past appointments
appointmentSchema.statics.findPast = function(userId, role = 'client') {
  const query = {
    date: { $lt: new Date() }
  }
  
  if (role === 'client') {
    query.client = userId
  } else if (role === 'lawyer') {
    query.lawyer = userId
  }
  
  return this.find(query)
    .populate('client', 'name email phone')
    .populate('lawyer', 'name email specialization')
    .sort({ date: -1, time: -1 })
}

// Static method to check availability
appointmentSchema.statics.checkAvailability = function(lawyerId, date, time) {
  const appointmentDate = new Date(date)
  const appointmentTime = time
  
  return this.findOne({
    lawyer: lawyerId,
    date: appointmentDate,
    time: appointmentTime,
    status: { $in: ['pending', 'confirmed'] }
  })
}

module.exports = mongoose.model('Appointment', appointmentSchema) 