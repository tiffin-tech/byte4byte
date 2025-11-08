const SubscriptionRequest = require('../models/SubscriptionRequest');
const Customer = require('../models/Customer');
//const Subscription = require('../models/Subscription');
const Subscription = require('../models/Subscription');

// Get subscription requests
exports.getRequests = async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    const vendorId = req.user.id;

    // Find vendor first to get vendor document ID
    const Vendor = require('../models/Vendor');
    const vendor = await Vendor.findOne({ userId: vendorId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    let query = { vendorId: vendor._id };
    if (filter !== 'all') {
      query.status = filter;
    }

    const requests = await SubscriptionRequest.find(query)
      .populate('customerId', 'personalInfo location')
      .sort({ requestedAt: -1 });

    // Get stats
    const stats = {
      pending: await SubscriptionRequest.countDocuments({ 
        vendorId: vendor._id, 
        status: 'pending' 
      }),
      acceptedThisMonth: await SubscriptionRequest.countDocuments({
        vendorId: vendor._id,
        status: 'accepted',
        requestedAt: { 
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
        }
      }),
      rejectedThisMonth: await SubscriptionRequest.countDocuments({
        vendorId: vendor._id,
        status: 'rejected',
        requestedAt: { 
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
        }
      })
    };

    res.json({
      success: true,
      data: {
        requests,
        stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription requests',
      error: error.message
    });
  }
};

// Accept subscription request
exports.acceptRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const Vendor = require('../models/Vendor');
    const vendor = await Vendor.findOne({ userId: vendorId });

    const request = await SubscriptionRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Subscription request not found'
      });
    }

    // Check if vendor owns this request
    if (request.vendorId.toString() !== vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update request status
    request.status = 'accepted';
    request.processedAt = new Date();
    request.processedBy = vendorId;
    await request.save();

    // Create subscription (you can expand this)
    const subscription = await Subscription.create({
      customerId: request.customerId,
      vendorId: vendor._id,
      planType: request.planType,
      preferences: request.preferences,
      status: 'active',
      startDate: request.preferences.startDate
    });

    res.json({
      success: true,
      message: 'Subscription request accepted',
      data: { request, subscription }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error accepting subscription request',
      error: error.message
    });
  }
};

// Reject subscription request
exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const vendorId = req.user.id;

    const Vendor = require('../models/Vendor');
    const vendor = await Vendor.findOne({ userId: vendorId });

    const request = await SubscriptionRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Subscription request not found'
      });
    }

    // Check if vendor owns this request
    if (request.vendorId.toString() !== vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update request status
    request.status = 'rejected';
    request.processedAt = new Date();
    request.processedBy = vendorId;
    request.rejectionReason = reason;
    await request.save();

    res.json({
      success: true,
      message: 'Subscription request rejected',
      data: { request }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting subscription request',
      error: error.message
    });
  }
};