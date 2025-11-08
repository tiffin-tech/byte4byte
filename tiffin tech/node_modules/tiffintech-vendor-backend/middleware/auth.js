const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, access denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

const vendorAuth = async (req, res, next) => {
  try {
    // First authenticate the user
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, access denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    req.user = user;

    // Check if user is vendor OR is completing vendor registration
    if (user.role !== 'vendor') {
      // Allow access if they're trying to complete vendor registration
      const isCompletingRegistration = req.originalUrl.includes('/complete-registration') && req.method === 'POST';
      
      if (!isCompletingRegistration) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Vendor role required.'
        });
      }
    }
    
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
};

module.exports = { auth, vendorAuth };