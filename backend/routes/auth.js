const express = require('express')
const { body, validationResult } = require('express-validator')
const User = require('../models/User')
const { auth } = require('../middleware/auth')
const { generateToken } = require('../config/jwt')
const Credit = require('../models/Credit')
const router = express.Router()


// Register user
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('role').isIn(['client', 'lawyer', 'admin']).withMessage('Invalid role - Only client, lawyer, and admin roles are allowed'),
  // Lawyer-specific validation
  body('specialization').if(body('role').equals('lawyer')).notEmpty().withMessage('Specialization is required for lawyers'),
  body('barNumber').if(body('role').equals('lawyer')).notEmpty().withMessage('Bar number is required for lawyers'),
  body('hourlyRate').if(body('role').equals('lawyer')).isNumeric().withMessage('Hourly rate must be a number'),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      console.log('Registration validation errors:', errors.array())
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { name, email, password, phone, address, role, specialization, barNumber, hourlyRate, bio, languages } = req.body
    console.log('Registration attempt:', { name, email, role })

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      console.log('User already exists:', email)
      return res.status(400).json({ message: 'User with this email already exists' })
    }

    // Create user data
    const userData = {
      name,
      email,
      password,
      phone,
      address,
      role
    }

    // Add lawyer-specific fields if role is lawyer
    if (role === 'lawyer') {
      userData.specialization = specialization
      userData.barNumber = barNumber
      userData.hourlyRate = hourlyRate
      userData.bio = bio
      userData.languages = languages || ['English']
      userData.isVerified = false // Lawyers need verification
    } else if (role === 'admin') {
      userData.isVerified = true // Admins are pre-verified
    } else {
      userData.isVerified = true // Clients are auto-verified
    }

    console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' })

    // Create new user
    const user = new User(userData)
    await user.save()

    // Create default credit record
    await Credit.create({ user: user._id })

    console.log('User created successfully:', { name: user.name, role: user.role, isVerified: user.isVerified })

    // Generate JWT token
    const token = generateToken({ userId: user._id, role: user.role })

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON(),
      token
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Server error during registration' })
  }
})

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { email, password } = req.body
    console.log('Login attempt for email:', email)

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      console.log('User not found for email:', email)
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    console.log('User found:', { name: user.name, role: user.role, isActive: user.isActive })

    // Check if user is active
    if (!user.isActive) {
      console.log('User account is deactivated:', email)
      return res.status(401).json({ message: 'Account is deactivated' })
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password)
    console.log('Password validation result:', isPasswordValid)
    
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email)
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Generate JWT token
    const token = generateToken({ userId: user._id, role: user.role })

    console.log('Login successful for user:', user.name)

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error during login' })
  }
})

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({ user: user.toJSON() })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get current user’s credit balance
router.get('/me/credit', auth, async (req, res) => {
  try {
    // try to load from your Credit collection
    const creditDoc = await Credit.findOne({ user: req.user.userId })
    if (!creditDoc) {
      creditDoc = await Credit.create({ user: req.user.userId })
    }
    if (!creditDoc) {
       // Agar pehle se nahi hai to create karo default record
       creditDoc = await Credit.create({ user: req.user.userId })
       }
    res.json({ balance: creditDoc.balance })
  } catch (error) {
    console.error('Get credit error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update user profile
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('phone').optional().trim().notEmpty().withMessage('Phone number is required'),
  body('address').optional().trim().notEmpty().withMessage('Address is required'),
  body('bio').optional().isLength({ max: 1000 }).withMessage('Bio must be less than 1000 characters'),
  body('languages').optional().isArray().withMessage('Languages must be an array'),
  body('hourlyRate').optional().isNumeric().withMessage('Hourly rate must be a number'),
  body('specialization').optional().trim().notEmpty().withMessage('Specialization cannot be empty'),
  body('barNumber').optional().trim().notEmpty().withMessage('Bar number cannot be empty')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Update allowed fields based on user role
    const allowedUpdates = ['name', 'phone', 'address', 'bio', 'isAvailable']
    
    // Add lawyer-specific fields if user is a lawyer
    if (user.role === 'lawyer') {
      allowedUpdates.push('languages', 'hourlyRate', 'specialization', 'barNumber')
    }

    const updates = {}
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field]
      }
    })

    // Update user
    Object.assign(user, updates)
    await user.save()

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ message: 'Server error during profile update' })
  }
})

// Change password
router.put('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { currentPassword, newPassword } = req.body

    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ message: 'Server error during password change' })
  }
})

// Toggle availability status (for lawyers)
router.patch('/toggle-availability', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Only lawyers can toggle availability
    if (user.role !== 'lawyer') {
      return res.status(403).json({ message: 'Only lawyers can toggle availability' })
    }

    // Toggle availability
    user.isAvailable = !user.isAvailable
    await user.save()

    res.json({
      message: `Availability ${user.isAvailable ? 'enabled' : 'disabled'} successfully`,
      user: user.toJSON()
    })
  } catch (error) {
    console.error('Toggle availability error:', error)
    res.status(500).json({ message: 'Server error during availability toggle' })
  }
})

// Logout (client-side token removal)
router.post('/logout', auth, (req, res) => {
  res.json({ message: 'Logged out successfully' })
})

module.exports = router 