const User = require('../models/User')
const { verifyToken } = require('../config/jwt')

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' })
    }

    // Extract token
    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token)
    
    // Check if user exists
    const user = await User.findById(decoded.userId)
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' })
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    }

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(401).json({ message: 'Token is not valid' })
  }
}

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' })
    }

    next()
  }
}

// Specific role middleware functions
const requireClient = authorize('client')
const requireLawyer = authorize('lawyer')
const requireAdmin = authorize('admin')
const requireLawyerOrAdmin = authorize('lawyer', 'admin')

module.exports = {
  auth,
  authorize,
  requireClient,
  requireLawyer,
  requireAdmin,
  requireLawyerOrAdmin
} 