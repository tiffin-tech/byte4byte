import express from 'express';
import Order from '../models/Order.js';
import Subscription from '../models/Subscription.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all orders for student
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const studentId = req.studentId;

    let filter = { studentId };
    
    if (status && status !== 'all') {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate('vendorId', 'name images')
      .populate('subscriptionId')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasNext: skip + orders.length < totalOrders,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single order details
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      studentId: req.studentId
    })
    .populate('vendorId')
    .populate('subscriptionId')
    .populate('holidayId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Order details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Rate and review order
router.put('/:id/rate', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      studentId: req.studentId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate delivered orders'
      });
    }

    order.rating = rating;
    order.feedback = {
      comment,
      submittedAt: new Date()
    };

    await order.save();

    // Update vendor rating (average calculation would be in vendor model)
    // This is a simplified version

    res.json({
      success: true,
      message: 'Order rated successfully',
      data: order
    });

  } catch (error) {
    console.error('Rate order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get today's orders
router.get('/today/orders', auth, async (req, res) => {
  try {
    const studentId = req.studentId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysOrders = await Order.find({
      studentId,
      date: { $gte: today, $lt: tomorrow }
    })
    .populate('vendorId', 'name')
    .sort({ 'deliveryTime.scheduled': 1 });

    res.json({
      success: true,
      data: todaysOrders
    });

  } catch (error) {
    console.error('Today orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get order statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const studentId = req.studentId;

    const totalOrders = await Order.countDocuments({ studentId });
    const deliveredOrders = await Order.countDocuments({
      studentId,
      status: 'delivered'
    });
    const pendingOrders = await Order.countDocuments({
      studentId,
      status: { $in: ['scheduled', 'preparing', 'ready', 'out-for-delivery'] }
    });

    // Monthly spending
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlySpending = await Order.aggregate([
      {
        $match: {
          studentId: studentId,
          date: { $gte: startOfMonth },
          status: 'delivered'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$finalAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        deliveredOrders,
        pendingOrders,
        monthlySpending: monthlySpending[0]?.total || 0
      }
    });

  } catch (error) {
    console.error('Order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;