import express from 'express';
import Message from '../models/Message.js';
import Vendor from '../models/Vendor.js';
import Notification from '../models/Notification.js';
import {auth} from '../middleware/auth.js';

const router = express.Router();

// Get all message threads for student (for messages.html)
router.get('/threads', auth, async (req, res) => {
  try {
    const studentId = req.studentId;

    // Get distinct vendor threads with latest message
    const threads = await Message.aggregate([
      {
        $match: { studentId: studentId }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$vendorId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [{ $eq: ['$isRead', false] }, 1, 0]
            }
          },
          totalMessages: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'vendors',
          localField: '_id',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      {
        $unwind: '$vendor'
      },
      {
        $project: {
          'vendor.password': 0
        }
      }
    ]);

    res.json({
      success: true,
      data: threads
    });

  } catch (error) {
    console.error('Message threads error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get messages in a thread
router.get('/threads/:vendorId', auth, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const studentId = req.studentId;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({
      studentId,
      vendorId
    })
    .populate('vendorId', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      {
        studentId,
        vendorId,
        type: 'vendor_to_student',
        isRead: false
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    const totalMessages = await Message.countDocuments({
      studentId,
      vendorId
    });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalMessages / limit),
          totalMessages,
          hasNext: skip + messages.length < totalMessages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Thread messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send message to vendor
router.post('/threads/:vendorId', auth, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const studentId = req.studentId;
    const { message, subject = '' } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Check if vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const newMessage = new Message({
      studentId,
      vendorId,
      type: 'student_to_vendor',
      subject,
      message,
      isThreadStart: false // Will be set if it's the first message
    });

    // Check if this is the first message in thread
    const existingThread = await Message.findOne({
      studentId,
      vendorId
    });

    if (!existingThread) {
      newMessage.isThreadStart = true;
    } else {
      newMessage.threadId = existingThread.threadId || existingThread._id;
    }

    await newMessage.save();

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark message as read
router.put('/:messageId/read', auth, async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      studentId: req.studentId
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: 'Message marked as read',
      data: message
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get unread messages count
router.get('/unread/count', auth, async (req, res) => {
  try {
    const studentId = req.studentId;

    const unreadCount = await Message.countDocuments({
      studentId,
      type: 'vendor_to_student',
      isRead: false
    });

    res.json({
      success: true,
      data: {
        unreadCount
      }
    });

  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;