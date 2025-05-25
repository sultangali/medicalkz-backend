const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    // Get user from the token - use userId field from token
    const userId = decoded.userId || decoded.id; // Support both formats
    console.log('Looking for user with ID:', userId);
    
    req.user = await User.findById(userId).select('-password');
    console.log('Found user:', req.user ? { id: req.user._id, role: req.user.role } : 'null');

    if (!req.user) {
      console.log('User not found in database');
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    next();
  } catch (err) {
    console.log('Token verification error:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log('Checking authorization for roles:', roles);
    console.log('User role:', req.user ? req.user.role : 'no user');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    
    next();
  };
}; 