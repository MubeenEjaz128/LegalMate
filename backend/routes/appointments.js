const express = require('express')
const { body, validationResult } = require('express-validator')
const Appointment = require('../models/Appointment')
const User = require('../models/User')
const { auth, requireClient, requireLawyer, requireAdmin } = require('../middleware/auth')
const router = express.Router()
const stripe = require('../config/stripe');
const Transaction = require('../models/Transaction');
const { getCommission } = require('../config/commission');
const expressRaw = require('express').raw;

// Book appointment and pay (dummy credits)
router.post('/', auth, requireClient, [
  body('lawyerId').isMongoId().withMessage('Valid lawyer ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format is required'),
  body('consultationType').isIn(['chat', 'video']).withMessage('Valid consultation type is required'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      })
    }
    const { lawyerId, date, time, consultationType, description } = req.body
    const clientId = req.user.userId
    const lawyer = await User.findById(lawyerId)
      .where({ role: 'lawyer', isActive: true })
    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' })
    }
    const existingAppointment = await Appointment.findOne({
      lawyer: lawyerId,
      client: clientId,
      date: new Date(date),
      time,
      status: { $in: ['pending', 'confirmed'] }
    })
    if (existingAppointment) {
      return res.status(400).json({ message: 'Appointment already exists for this time' })
    }
    // Check client credits
    const client = await User.findById(clientId)
    if (client.credits < lawyer.hourlyRate) {
      return res.status(400).json({ message: 'Insufficient credits. Please top up your account.' })
    }
    // Deduct credits from client
    client.credits -= lawyer.hourlyRate
    await client.save()
    // Create appointment
    const appointment = new Appointment({
      lawyer: lawyerId,
      client: clientId,
      date: new Date(date),
      time,
      consultationType,
      description,
      status: 'pending',
      amount: lawyer.hourlyRate,
      paymentStatus: 'pending'
    })
    await appointment.save()
    // Create transaction (hold funds)
    const commissionPercent = getCommission()
    const commission = Math.round((lawyer.hourlyRate * commissionPercent) / 100)
    const transaction = new Transaction({
      appointment: appointment._id,
      payer: clientId,
      payee: lawyerId,
      amount: lawyer.hourlyRate,
      commission,
      status: 'pending',
      isDummy: true
    })
    await transaction.save()
    await appointment.populate('lawyer', 'name email')
    await appointment.populate('client', 'name email')
    res.status(201).json({
      message: 'Appointment booked and payment held. Awaiting admin approval.',
      appointment,
      transaction
    })
  } catch (error) {
    console.error('Book appointment error:', error)
    res.status(500).json({ message: 'Error booking appointment' })
  }
})

// Get appointments for user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    let appointments
    if (user.role === 'lawyer') {
      appointments = await Appointment.find({ lawyer: userId })
        .populate('client', 'name email')
        .sort({ date: -1, time: -1 })
    } else {
      appointments = await Appointment.find({ client: userId })
        .populate('lawyer', 'name email specialization')
        .sort({ date: -1, time: -1 })
    }

    res.json(appointments)
  } catch (error) {
    console.error('Get appointments error:', error)
    res.status(500).json({ message: 'Error fetching appointments' })
  }
})

// Get appointment statistics (must come before /:id route)
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const userId = req.user.userId
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    let stats
    if (user.role === 'lawyer') {
      const total = await Appointment.countDocuments({ lawyer: userId })
      const pending = await Appointment.countDocuments({ 
        lawyer: userId, 
        status: 'pending' 
      })
      const confirmed = await Appointment.countDocuments({ 
        lawyer: userId, 
        status: 'confirmed' 
      })
      const completed = await Appointment.countDocuments({ 
        lawyer: userId, 
        status: 'completed' 
      })

      stats = { total, pending, confirmed, completed }
    } else {
      const total = await Appointment.countDocuments({ client: userId })
      const pending = await Appointment.countDocuments({ 
        client: userId, 
        status: 'pending' 
      })
      const confirmed = await Appointment.countDocuments({ 
        client: userId, 
        status: 'confirmed' 
      })
      const completed = await Appointment.countDocuments({ 
        client: userId, 
        status: 'completed' 
      })

      stats = { total, pending, confirmed, completed }
    }

    res.json(stats)
  } catch (error) {
    console.error('Get appointment stats error:', error)
    res.status(500).json({ message: 'Error fetching appointment statistics' })
  }
})

// Get appointment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('lawyer', 'name email specialization')
      .populate('client', 'name email')

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' })
    }

    // Check if user has access to this appointment
    const userId = req.user.userId
    const lawyerId = appointment.lawyer._id.toString()
    const clientId = appointment.client._id.toString()
    
    // Debug logging
    console.log('Access check:', {
      userId,
      lawyerId,
      clientId,
      isLawyer: userId === lawyerId,
      isClient: userId === clientId,
      userRole: req.user.role
    })

    // Allow access if user is the client, lawyer, or admin
    if (userId !== lawyerId && userId !== clientId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied',
        debug: {
          userId,
          lawyerId,
          clientId,
          userRole: req.user.role
        }
      })
    }

    res.json(appointment)
  } catch (error) {
    console.error('Get appointment error:', error)
    res.status(500).json({ message: 'Error fetching appointment' })
  }
})

// Update appointment status (lawyer only)
router.patch('/:id/status', auth, requireLawyer, [
  body('status').isIn(['pending', 'confirmed', 'rejected', 'cancelled', 'completed']).withMessage('Valid status is required'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { status, notes } = req.body
    const appointmentId = req.params.id
    const lawyerId = req.user.userId

    const appointment = await Appointment.findById(appointmentId)
      .populate('lawyer', 'name email')
      .populate('client', 'name email')

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' })
    }

    if (appointment.lawyer._id.toString() !== lawyerId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Validate status transition
    const validTransitions = {
      pending: ['confirmed', 'rejected', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      rejected: [],
      cancelled: [],
      completed: []
    }

    const currentStatus = appointment.status
    const allowedTransitions = validTransitions[currentStatus] || []

    if (!allowedTransitions.includes(status)) {
      return res.status(400).json({ 
        message: `Cannot change status from ${currentStatus} to ${status}`,
        allowedTransitions
      })
    }

    appointment.status = status
    if (notes) {
      appointment.notes = notes
    }

    await appointment.save()

    res.json({
      message: 'Appointment status updated successfully',
      appointment
    })
  } catch (error) {
    console.error('Update appointment status error:', error)
    res.status(500).json({ message: 'Error updating appointment status' })
  }
})

// Cancel appointment (client only)
router.patch('/:id/cancel', auth, requireClient, async (req, res) => {
  try {
    const appointmentId = req.params.id
    const clientId = req.user.userId

    const appointment = await Appointment.findById(appointmentId)
      .populate('lawyer', 'name email')
      .populate('client', 'name email')

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' })
    }

    if (appointment.client._id.toString() !== clientId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Appointment is already cancelled' })
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed appointment' })
    }

    appointment.status = 'cancelled'
    await appointment.save()

    res.json({
      message: 'Appointment cancelled successfully',
      appointment
    })
  } catch (error) {
    console.error('Cancel appointment error:', error)
    res.status(500).json({ message: 'Error cancelling appointment' })
  }
})

// Admin approves transaction (release to lawyer)
router.post('/:id/approve', auth, requireAdmin, async (req, res) => {
  try {
    const appointmentId = req.params.id
    const transaction = await Transaction.findOne({ appointment: appointmentId, status: 'pending' })
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' })
    const lawyer = await User.findById(transaction.payee)
    if (!lawyer) return res.status(404).json({ message: 'Lawyer not found' })
    // Release credits to lawyer (minus commission)
    lawyer.credits += (transaction.amount - transaction.commission)
    await lawyer.save()
    transaction.status = 'approved'
    transaction.approvedBy = req.user.userId
    await transaction.save()
    await Appointment.findByIdAndUpdate(appointmentId, { paymentStatus: 'paid' })
    res.json({ message: 'Payment released to lawyer', transaction })
  } catch (error) {
    console.error('Admin approve error:', error)
    res.status(500).json({ message: 'Error approving transaction' })
  }
})

// Client requests refund (with proof)
router.post('/:id/request-refund', auth, requireClient, async (req, res) => {
  try {
    const appointmentId = req.params.id
    const { proof } = req.body
    const transaction = await Transaction.findOne({ appointment: appointmentId, status: 'pending' })
    if (!transaction) return res.status(404).json({ message: 'Transaction not found or already processed' })
    transaction.refundRequested = true
    transaction.refundProof = proof
    await transaction.save()
    res.json({ message: 'Refund requested. Admin will review your proof.', transaction })
  } catch (error) {
    console.error('Refund request error:', error)
    res.status(500).json({ message: 'Error requesting refund' })
  }
})

// Admin approves refund
router.post('/:id/approve-refund', auth, requireAdmin, async (req, res) => {
  try {
    const appointmentId = req.params.id
    const transaction = await Transaction.findOne({ appointment: appointmentId, status: 'pending', refundRequested: true })
    if (!transaction) return res.status(404).json({ message: 'Refund request not found' })
    const client = await User.findById(transaction.payer)
    if (!client) return res.status(404).json({ message: 'Client not found' })
    client.credits += transaction.amount
    await client.save()
    transaction.status = 'refunded'
    await transaction.save()
    await Appointment.findByIdAndUpdate(appointmentId, { paymentStatus: 'refunded' })
    res.json({ message: 'Refund approved and credits returned to client', transaction })
  } catch (error) {
    console.error('Approve refund error:', error)
    res.status(500).json({ message: 'Error approving refund' })
  }
})

module.exports = router 