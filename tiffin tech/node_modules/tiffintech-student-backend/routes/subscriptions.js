import express from 'express';
import { studentAuth } from '../middleware/auth.js';
import Subscription from '../models/Subscription.js';

const router = express.Router();

// Get all subscriptions for user - USE studentAuth middleware
router.get('/', studentAuth, async (req, res) => {
  try {
    console.log('📦 Fetching subscriptions for student:', req.userId);
    
    const subscriptions = await Subscription.find({ userId: req.userId })
      .populate('vendorId', 'name cuisine rating image')
      .sort({ createdAt: -1 });

    console.log(`📦 Found ${subscriptions.length} subscriptions`);

    // Calculate progress for each subscription
    const subscriptionsWithProgress = subscriptions.map(sub => {
      const subObj = sub.toObject();
      const progressPercentage = Math.round((sub.daysCompleted / sub.daysTotal) * 100);
      
      return {
        ...subObj,
        progressPercentage
      };
    });

    res.json({
      success: true,
      data: subscriptionsWithProgress
    });
  } catch (error) {
    console.error('❌ Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching subscriptions'
    });
  }
});

// Create new subscription
router.post('/create', studentAuth, async (req, res) => {
  try {
    console.log('🆕 Creating subscription for student:', req.userId);

    const {
      vendorId,
      planType,
      billingCycle,
      price,
      startDate,
      spicePreference,
      specialInstructions
    } = req.body;

    // Validate required fields
    if (!vendorId || !planType || !billingCycle || !price || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const subscription = new Subscription({
      userId: req.userId,
      vendorId,
      planType,
      billingCycle,
      price,
      startDate,
      spicePreference: spicePreference || 'medium',
      specialInstructions: specialInstructions || ''
    });

    await subscription.save();
    
    // Populate vendor info for response
    await subscription.populate('vendorId', 'name cuisine rating image');

    console.log('✅ Subscription created:', subscription._id);

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: subscription
    });
  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating subscription'
    });
  }
});

// Pause subscription
router.post('/:id/pause', studentAuth, async (req, res) => {
  try {
    console.log('⏸️ Pausing subscription:', req.params.id);

    const { pauseDate, resumeDate, reason, notes } = req.body;
    
    if (!pauseDate) {
      return res.status(400).json({
        success: false,
        message: 'Pause date is required'
      });
    }

    const subscription = await Subscription.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active subscriptions can be paused'
      });
    }

    subscription.status = 'paused';
    subscription.pauseDetails = {
      isPaused: true,
      pausedAt: new Date(pauseDate),
      resumeDate: resumeDate ? new Date(resumeDate) : null,
      reason: reason || 'other',
      notes: notes || ''
    };

    await subscription.save();

    console.log('✅ Subscription paused:', subscription._id);

    res.json({
      success: true,
      message: 'Subscription paused successfully',
      data: subscription
    });
  } catch (error) {
    console.error('❌ Error pausing subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Server error pausing subscription'
    });
  }
});

// Resume subscription
router.post('/:id/resume', studentAuth, async (req, res) => {
  try {
    console.log('▶️ Resuming subscription:', req.params.id);

    const subscription = await Subscription.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.status !== 'paused') {
      return res.status(400).json({
        success: false,
        message: 'Only paused subscriptions can be resumed'
      });
    }

    subscription.status = 'active';
    subscription.pauseDetails = {
      isPaused: false,
      pausedAt: null,
      resumeDate: null,
      reason: '',
      notes: ''
    };

    await subscription.save();

    console.log('✅ Subscription resumed:', subscription._id);

    res.json({
      success: true,
      message: 'Subscription resumed successfully',
      data: subscription
    });
  } catch (error) {
    console.error('❌ Error resuming subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resuming subscription'
    });
  }
});

// Cancel subscription
router.post('/:id/cancel', studentAuth, async (req, res) => {
  try {
    console.log('❌ Cancelling subscription:', req.params.id);

    const subscription = await Subscription.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    subscription.status = 'cancelled';
    await subscription.save();

    console.log('✅ Subscription cancelled:', subscription._id);

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription
    });
  } catch (error) {
    console.error('❌ Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling subscription'
    });
  }
});

export default router;