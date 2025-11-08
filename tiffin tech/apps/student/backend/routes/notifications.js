import express from 'express';
import Notification from '../models/Notification.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all notifications with filtering (for notification.html)
router.get('/', auth, async (req, res) => {
  try {
    const { category, isRead, page = 1, limit = 20 } = req.query;
    const studentId = req.studentId;

    let filter = { studentId };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalNotifications = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      studentId,
      isRead: false
    });

    res.json({
      success: true,
      data: {
        notifications,
        stats: {
          total: totalNotifications,
          unread: unreadCount,
          read: totalNotifications - unreadCount
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalNotifications / limit),
          totalNotifications,
          hasNext: skip + notifications.length < totalNotifications,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      studentId: req.studentId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      {
        studentId: req.studentId,
        isRead: false
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    const unreadCount = await Notification.countDocuments({
      studentId: req.studentId,
      isRead: false
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        unreadCount
      }
    });

  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      studentId: req.studentId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Clear all notifications
router.delete('/', auth, async (req, res) => {
  try {
    await Notification.deleteMany({
      studentId: req.studentId
    });

    res.json({
      success: true,
      message: 'All notifications cleared successfully'
    });

  } catch (error) {
    console.error('Clear all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get notification categories count
router.get('/categories', auth, async (req, res) => {
  try {
    const studentId = req.studentId;

    const categories = await Notification.aggregate([
      {
        $match: { studentId: studentId }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Categories count error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;