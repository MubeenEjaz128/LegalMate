const express = require('express')
const { body, validationResult } = require('express-validator')
const mongoose = require('mongoose')
const User = require('../models/User')
const Appointment = require('../models/Appointment')
const { auth, requireAdmin } = require('../middleware/auth')
const { getCommission, setCommission } = require('../config/commission');
const router = express.Router()
const ChatMessage = require('../models/ChatMessage');

// Test endpoint to check if admin routes are working
router.get('/test', auth, requireAdmin, (req, res) => {
  res.json({ 
    message: 'Admin routes are working',
    user: req.user,
    timestamp: new Date().toISOString()
  })
})

// Get all users (admin only)
router.get('/users', auth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status } = req.query
    const skip = (page - 1) * limit

    const query = {}
    if (role) query.role = role
    if (status) query.isActive = status === 'active'

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await User.countDocuments(query)

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ message: 'Error fetching users' })
  }
})

// Get user details (admin only)
router.get('/users/:id', auth, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id

    const user = await User.findById(userId).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      user: user.toJSON()
    })
  } catch (error) {
    console.error('Get user details error:', error)
    res.status(500).json({ message: 'Error fetching user details' })
  }
})

// Update user status (admin only)
router.patch('/users/:id/status', auth, requireAdmin, [
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isVerified').optional().isBoolean().withMessage('isVerified must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { isActive, isVerified } = req.body
    const userId = req.params.id

    console.log(`Updating user ${userId} status:`, { isActive, isVerified });

    const user = await User.findById(userId)
    if (!user) {
      console.error(`User not found: ${userId}`);
      return res.status(404).json({ message: 'User not found' })
    }

    // Only update fields that are provided
    let updated = false;
    if (isActive !== undefined) {
      user.isActive = isActive
      updated = true;
      console.log(`Updated isActive to: ${isActive}`);
    }
    if (isVerified !== undefined) {
      user.isVerified = isVerified
      updated = true;
      console.log(`Updated isVerified to: ${isVerified}`);
    }

    if (!updated) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    await user.save()
    console.log(`User ${userId} updated successfully`);

    res.json({
      message: 'User status updated successfully',
      user: user.toJSON()
    })
  } catch (error) {
    console.error('Update user status error:', error)
    res.status(500).json({ message: 'Error updating user status' })
  }
})

// Get system statistics (admin only)
router.get('/stats', auth, requireAdmin, async (req, res) => {
  try {
    console.log('Fetching admin statistics...')
    console.log('User making request:', req.user)
    
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected. ReadyState:', mongoose.connection.readyState)
      return res.status(500).json({ message: 'Database connection error' })
    }
    
    const totalUsers = await User.countDocuments()
    console.log('Total users:', totalUsers)
    
    const totalLawyers = await User.countDocuments({ role: 'lawyer' })
    const totalClients = await User.countDocuments({ role: 'client' })
    const activeLawyers = await User.countDocuments({ 
      role: 'lawyer', 
      isActive: true, 
      isVerified: true 
    })
    const totalAppointments = await Appointment.countDocuments()
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' })
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' })
    const confirmedAppointments = await Appointment.countDocuments({ status: 'confirmed' })
    const cancelledAppointments = await Appointment.countDocuments({ status: 'cancelled' })
    const rejectedAppointments = await Appointment.countDocuments({ status: 'rejected' })

    // Get recent registrations (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    })

    const recentAppointments = await Appointment.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    })

    const stats = {
      users: {
        total: totalUsers,
        lawyers: totalLawyers,
        clients: totalClients,
        activeLawyers,
        recentRegistrations
      },
      appointments: {
        total: totalAppointments,
        pending: pendingAppointments,
        confirmed: confirmedAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        rejected: rejectedAppointments,
        recent: recentAppointments
      }
    }

    console.log('Admin statistics:', stats)
    res.json(stats)
  } catch (error) {
    console.error('Get admin stats error:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ 
      message: 'Error fetching statistics',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

// Get lawyer verification requests (admin only)
router.get('/verification-requests', auth, requireAdmin, async (req, res) => {
  try {
    const lawyers = await User.find({ 
      role: 'lawyer', 
      isActive: true, 
      isVerified: false 
    })
    .select('name email specialization location createdAt')
    .sort({ createdAt: -1 })

    res.json(lawyers)
  } catch (error) {
    console.error('Get verification requests error:', error)
    res.status(500).json({ message: 'Error fetching verification requests' })
  }
})

// Verify lawyer (admin only)
router.post('/verify-lawyer/:id', auth, requireAdmin, async (req, res) => {
  try {
    const lawyerId = req.params.id

    const lawyer = await User.findById(lawyerId)
      .where({ role: 'lawyer' })

    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' })
    }

    lawyer.isVerified = true
    await lawyer.save()

    res.json({
      message: 'Lawyer verified successfully',
      lawyer: lawyer.toJSON()
    })
  } catch (error) {
    console.error('Verify lawyer error:', error)
    res.status(500).json({ message: 'Error verifying lawyer' })
  }
})

// Get system logs (admin only)
router.get('/logs', auth, requireAdmin, async (req, res) => {
  try {
    // TODO: Implement system logging
    // For now, return empty array
    res.json([])
  } catch (error) {
    console.error('Get logs error:', error)
    res.status(500).json({ message: 'Error fetching logs' })
  }
})

// Dummy endpoint for analytics (same as /stats)
router.get('/analytics', auth, requireAdmin, async (req, res) => {
  try {
    // Reuse the /stats logic
    const totalUsers = await User.countDocuments()
    const totalLawyers = await User.countDocuments({ role: 'lawyer' })
    const totalClients = await User.countDocuments({ role: 'client' })
    const activeLawyers = await User.countDocuments({ 
      role: 'lawyer', 
      isActive: true, 
      isVerified: true 
    })
    const totalAppointments = await Appointment.countDocuments()
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' })
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' })
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentRegistrations = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } })
    const recentAppointments = await Appointment.countDocuments({ createdAt: { $gte: sevenDaysAgo } })
    res.json({
      users: {
        total: totalUsers,
        lawyers: totalLawyers,
        clients: totalClients,
        activeLawyers,
        recentRegistrations
      },
      appointments: {
        total: totalAppointments,
        pending: pendingAppointments,
        completed: completedAppointments,
        recent: recentAppointments
      }
    })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics' })
  }
})

// Dummy endpoint for pending lawyers (same as /verification-requests)
router.get('/pending-lawyers', auth, requireAdmin, async (req, res) => {
  try {
    const lawyers = await User.find({ 
      role: 'lawyer', 
      isActive: true, 
      isVerified: false 
    })
    .select('name email specialization location createdAt')
    .sort({ createdAt: -1 })
    res.json(lawyers)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending lawyers' })
  }
})

// Dummy endpoint for flagged content
router.get('/flagged-content', auth, requireAdmin, async (req, res) => {
  try {
    res.json([])
  } catch (error) {
    res.status(500).json({ message: 'Error fetching flagged content' })
  }
})

// Moderate content (admin only)
router.post('/moderate-content', auth, requireAdmin, [
  body('contentId').notEmpty().withMessage('Content ID is required'),
  body('action').isIn(['approve', 'remove']).withMessage('Action must be approve or remove')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { contentId, action } = req.body

    // TODO: Implement actual content moderation logic
    // For now, just return success
    res.json({
      message: `Content ${action} successfully`,
      contentId,
      action
    })
  } catch (error) {
    console.error('Moderate content error:', error)
    res.status(500).json({ message: 'Error moderating content' })
  }
})

// Debug endpoint to check appointment counts
router.get('/debug/appointments', auth, requireAdmin, async (req, res) => {
  try {
    console.log('Debug: Checking appointment counts...')
    
    const total = await Appointment.countDocuments()
    const pending = await Appointment.countDocuments({ status: 'pending' })
    const confirmed = await Appointment.countDocuments({ status: 'confirmed' })
    const completed = await Appointment.countDocuments({ status: 'completed' })
    const cancelled = await Appointment.countDocuments({ status: 'cancelled' })
    const rejected = await Appointment.countDocuments({ status: 'rejected' })
    
    // Get some sample appointments
    const sampleAppointments = await Appointment.find()
      .select('status date time client lawyer')
      .limit(5)
      .populate('client', 'name')
      .populate('lawyer', 'name')
    
    const debugData = {
      counts: {
        total,
        pending,
        confirmed,
        completed,
        cancelled,
        rejected
      },
      sampleAppointments: sampleAppointments.map(apt => ({
        id: apt._id,
        status: apt.status,
        date: apt.date,
        time: apt.time,
        client: apt.client?.name || 'Unknown',
        lawyer: apt.lawyer?.name || 'Unknown'
      }))
    }
    
    console.log('Debug data:', debugData)
    res.json(debugData)
  } catch (error) {
    console.error('Debug endpoint error:', error)
    res.status(500).json({ message: 'Error fetching debug data' })
  }
})

// Test endpoint to create sample data (for development only)
router.post('/test-data', auth, requireAdmin, async (req, res) => {
  try {
    console.log('Creating test data...')
    
    // Create a test completed appointment
    const testAppointment = new Appointment({
      client: '507f1f77bcf86cd799439011', // Dummy client ID
      lawyer: '507f1f77bcf86cd799439012', // Dummy lawyer ID
      date: new Date(),
      time: '10:00',
      consultationType: 'video',
      status: 'completed',
      amount: 1000,
      notes: 'Test completed appointment'
    })
    
    await testAppointment.save()
    console.log('Test appointment created:', testAppointment._id)
    
    res.json({
      message: 'Test data created successfully',
      appointmentId: testAppointment._id
    })
  } catch (error) {
    console.error('Error creating test data:', error)
    res.status(500).json({ message: 'Error creating test data' })
  }
})

// Get current commission percentage
router.get('/commission', auth, requireAdmin, (req, res) => {
  res.json({ commission: getCommission() });
});

// Set commission percentage
router.post('/commission', auth, requireAdmin, [
  body('commission').isNumeric().isFloat({ min: 0, max: 100 }).withMessage('Commission must be between 0 and 100')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { commission } = req.body;
  setCommission(Number(commission));
  res.json({ commission: getCommission() });
});

// Get all chat logs (admin only, paginated)
router.get('/chat-logs', auth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, conversationId } = req.query;
    const query = {};
    if (userId) {
      query.$or = [{ from: userId }, { to: userId }];
    }
    if (conversationId) {
      query.conversationId = conversationId;
    }
    const messages = await ChatMessage.find(query)
      .populate('from', 'name email')
      .populate('to', 'name email')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await ChatMessage.countDocuments(query);
    res.json({
      messages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin chat logs error:', error);
    res.status(500).json({ message: 'Error fetching chat logs' });
  }
});

// Get all video call logs (admin only, paginated)
router.get('/video-call-logs', auth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, userId } = req.query;
    const query = { consultationType: 'video' };
    if (userId) {
      query.$or = [{ client: userId }, { lawyer: userId }];
    }
    const appointments = await Appointment.find(query)
      .populate('client', 'name email')
      .populate('lawyer', 'name email')
      .sort({ startTime: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Appointment.countDocuments(query);
    const logs = appointments.map(a => ({
      _id: a._id,
      client: a.client,
      lawyer: a.lawyer,
      startTime: a.startTime,
      endTime: a.endTime,
      durationMinutes: a.startTime && a.endTime ? Math.round((a.endTime - a.startTime) / 60000) : null,
      status: a.status,
      sessionId: a.sessionId,
    }));
    res.json({
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin video call logs error:', error);
    res.status(500).json({ message: 'Error fetching video call logs' });
  }
});

// Admin credits a user's account (add credits)
router.post('/credit-user', auth, requireAdmin, [
  body('userId').isMongoId().withMessage('Valid userId is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }
    const { userId, amount } = req.body
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    user.credits = (user.credits || 0) + Number(amount)
    await user.save()
    res.json({ message: `Credited ${amount} to user`, user })
  } catch (error) {
    console.error('Credit user error:', error)
    res.status(500).json({ message: 'Error crediting user' })
  }
})

module.exports = router 