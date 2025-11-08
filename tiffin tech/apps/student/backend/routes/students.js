import express from 'express';
import Student from '../models/Student.js';
import Subscription from '../models/Subscription.js';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
//import {auth}from '../middleware/auth.js';
//import { auth, studentAuth, vendorAuth } from '../middleware/auth.js';
//import { auth } from '../middleware/auth.js';
import { auth, studentAuth } from '../middleware/auth.js';
const router = express.Router();

// Your student routes here
router.get('/', auth, (req, res) => {
  res.json({ message: 'Students route working!' });
});

// Get student profile
router.get('/profile', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: student
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update student profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, phone, address, preferences } = req.body;
    
    const student = await Student.findByIdAndUpdate(
      req.studentId,
      {
        $set: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phone && { phone }),
          ...(address && { address }),
          ...(preferences && { preferences })
        }
      },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: student
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get student dashboard data (for index.html)
router.get('/dashboard', auth, async (req, res) => {
  try {
    const studentId = req.studentId;

    // Get active subscriptions count
    const activeSubscriptions = await Subscription.countDocuments({
      studentId,
      status: 'active'
    });

    // Get recent orders
    const recentOrders = await Order.find({ studentId })
      .populate('vendorId', 'name')
      .sort({ date: -1 })
      .limit(5);

    // Get upcoming payment info
    const upcomingSubscription = await Subscription.findOne({
      studentId,
      status: 'active'
    }).sort({ nextBillingDate: 1 });

    let nextPayment = null;
    if (upcomingSubscription) {
      const daysUntilPayment = Math.ceil(
        (upcomingSubscription.nextBillingDate - new Date()) / (1000 * 60 * 60 * 24)
      );
      
      nextPayment = {
        amount: upcomingSubscription.price,
        dueInDays: daysUntilPayment > 0 ? daysUntilPayment : 0
      };
    }

    // Get unread notifications count
    const unreadNotifications = await Notification.countDocuments({
      studentId,
      isRead: false
    });

    res.json({
      success: true,
      data: {
        activeSubscriptions,
        recentOrders,
        nextPayment,
        unreadNotifications
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update student settings (for settings.html)
router.put('/settings', auth, async (req, res) => {
  try {
    const { notifications, privacy, preferences } = req.body;
    
    const student = await Student.findByIdAndUpdate(
      req.studentId,
      {
        $set: {
          ...(notifications && { 'settings.notifications': notifications }),
          ...(privacy && { 'settings.privacy': privacy }),
          ...(preferences && { preferences })
        }
      },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: student
    });

  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    const student = await Student.findById(req.studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await student.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    student.password = newPassword;
    await student.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;