import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import Vendor from '../models/Vendor.js';

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Handle both "Bearer token" and just "token" formats
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.replace('Bearer ', '') 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    console.log('🔐 Auth Middleware - Token received');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    console.log('🔐 Decoded token structure:', decoded);
    
    let user;

    // Handle YOUR token structure (id + userType)
    if (decoded.userType === 'student') {
      user = await Student.findById(decoded.id).select('-password');
      if (user) {
        req.userId = decoded.id;
        req.userRole = 'student';
        req.userType = 'student';
        console.log('✅ Student authenticated:', user.name);
      }
    } else if (decoded.userType === 'vendor') {
      user = await Vendor.findById(decoded.id).select('-password');
      if (user) {
        req.userId = decoded.id;
        req.userRole = 'vendor'; 
        req.userType = 'vendor';
        console.log('✅ Vendor authenticated:', user.name);
      }
    } else {
      // Fallback: try to find user by ID if userType is missing
      user = await Student.findById(decoded.id).select('-password');
      if (user) {
        req.userId = decoded.id;
        req.userRole = 'student';
        req.userType = 'student';
        console.log('✅ Student authenticated (fallback):', user.name);
      } else {
        user = await Vendor.findById(decoded.id).select('-password');
        if (user) {
          req.userId = decoded.id;
          req.userRole = 'vendor';
          req.userType = 'vendor';
          console.log('✅ Vendor authenticated (fallback):', user.name);
        }
      }
    }

    if (!user) {
      console.log('❌ User not found in database for ID:', decoded.id);
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    req.user = user;
    console.log('✅ Authentication successful for:', user.name);
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }

    res.status(401).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

// Student-only middleware
const studentAuth = async (req, res, next) => {
  try {
    // First run the main auth middleware
    await new Promise((resolve, reject) => {
      auth(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Then check if user is a student
    if (req.userType !== 'student') {
      console.log('❌ Student auth failed - user is:', req.userType);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student privileges required.'
      });
    }
    
    console.log('✅ Student authorization successful');
    next();
  } catch (error) {
    console.error('❌ Student auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
};

// Vendor-only middleware
const vendorAuth = async (req, res, next) => {
  try {
    // First run the main auth middleware
    await new Promise((resolve, reject) => {
      auth(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Then check if user is a vendor
    if (req.userType !== 'vendor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Vendor privileges required.'
      });
    }
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
};

// Optional auth
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.replace('Bearer ', '') 
        : authHeader;

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        
        let user;
        if (decoded.userType === 'student') {
          user = await Student.findById(decoded.id).select('-password');
          req.userId = decoded.id;
          req.userType = 'student';
        } else if (decoded.userType === 'vendor') {
          user = await Vendor.findById(decoded.id).select('-password');
          req.userId = decoded.id;
          req.userType = 'vendor';
        }

        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

export { auth, optionalAuth, studentAuth, vendorAuth };