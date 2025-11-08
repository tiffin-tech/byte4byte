import express from 'express';
import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import Vendor from '../models/Vendor.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Generate JWT Token
const generateToken = (userId, role = 'student') => {
  return jwt.sign(
    { userId, role }, 
    process.env.JWT_SECRET, 
    { expiresIn: '30d' }
  );
};

// Student Registration
router.post('/register/student', [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password, phone, address } = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student already exists with this email'
      });
    }

    // Create new student
    const student = new Student({
      firstName,
      lastName,
      email,
      password,
      phone,
      address: address || {}
    });

    await student.save();

    // Generate token
    const token = generateToken(student._id, 'student');

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: {
        student,
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Student Login
router.post('/login/student', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find student
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await student.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    student.lastLogin = new Date();
    await student.save();

    // Generate token
    const token = generateToken(student._id, 'student');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        student,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Vendor Login (for vendor side - your teammates)
router.post('/login/vendor', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find vendor
    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // For demo - in real app, use bcrypt compare
    const isPasswordValid = vendor.password === password; // Temporary
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(vendor._id, 'vendor');

    res.json({
      success: true,
      message: 'Vendor login successful',
      data: {
        vendor,
        token
      }
    });

  } catch (error) {
    console.error('Vendor login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user (student/vendor)
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user;
    if (decoded.role === 'student') {
      user = await Student.findById(decoded.userId);
    } else if (decoded.role === 'vendor') {
      user = await Vendor.findById(decoded.userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user,
        role: decoded.role
      }
    });

  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

export default router;