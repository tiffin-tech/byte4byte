const Vendor = require('../models/Vendor');
const User = require('../models/User');

// Complete vendor registration
exports.completeRegistration = async (req, res) => {
  try {
    const { personalInfo, businessInfo, pricing, availability } = req.body;
    const userId = req.user.id;

    // Check if user exists and update role to vendor
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user role to vendor
    user.role = 'vendor';
    await user.save();

    // Check if vendor already exists
    let vendor = await Vendor.findOne({ userId });
    if (vendor) {
      // Update existing vendor
      vendor = await Vendor.findOneAndUpdate(
        { userId },
        {
          personalInfo,
          businessInfo,
          pricing,
          availability,
          status: 'pending'
        },
        { new: true, runValidators: true }
      );
    } else {
      // Create new vendor
      vendor = await Vendor.create({
        userId,
        personalInfo,
        businessInfo,
        pricing,
        availability
      });
    }

    res.json({
      success: true,
      message: 'Vendor registration completed successfully',
      data: { vendor }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in vendor registration',
      error: error.message
    });
  }
};

// Get vendor profile
exports.getProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user.id })
      .populate('userId', 'name email');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    res.json({
      success: true,
      data: { vendor }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vendor profile',
      error: error.message
    });
  }
};

// Get vendor dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user.id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Mock data - in real app, aggregate from orders, payments, etc.
    const stats = {
      totalOrders: vendor.totalOrders || 150,
      monthlyRevenue: 75000,
      rating: vendor.rating || 4.5,
      customerCount: 45,
      todayVegOrders: 25,
      todayNonVegOrders: 15,
      extraVegOrders: 5,
      extraNonVegOrders: 3,
      paidCustomers: 40,
      pendingPayments: 5,
      totalRevenue: vendor.totalRevenue || 120000,
      pendingRequests: 3,
      status: vendor.status
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

// Update vendor profile
exports.updateProfile = async (req, res) => {
  try {
    const { personalInfo, businessInfo, pricing, availability } = req.body;
    
    const vendor = await Vendor.findOneAndUpdate(
      { userId: req.user.id },
      {
        personalInfo,
        businessInfo,
        pricing,
        availability
      },
      { new: true, runValidators: true }
    );

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    res.json({
      success: true,
      message: 'Vendor profile updated successfully',
      data: { vendor }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating vendor profile',
      error: error.message
    });
  }
};