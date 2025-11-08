const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const Order = require('../models/Order');

// Get all customers
exports.getCustomers = async (req, res) => {
  try {
    const { search, location, status, page = 1, limit = 10 } = req.query;
    const vendorId = req.user.id;

    const Vendor = require('../models/Vendor');
    const vendor = await Vendor.findOne({ userId: vendorId });

    let query = { vendorId: vendor._id };
    
    // Search filter
    if (search) {
      query['customerId.personalInfo.name'] = { 
        $regex: search, 
        $options: 'i' 
      };
    }
    
    // Location filter
    if (location && location !== 'All Locations') {
      query['customerId.location.hostel'] = location;
    }
    
    // Status filter
    if (status && status !== 'All Customers') {
      query.paymentStatus = status.toLowerCase();
    }

    const customers = await Customer.find(query)
      .populate('userId', 'name email')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customers',
      error: error.message
    });
  }
};

// Get paid customers
exports.getPaidCustomers = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const Vendor = require('../models/Vendor');
    const vendor = await Vendor.findOne({ userId: vendorId });

    const payments = await Payment.find({ 
      vendorId: vendor._id,
      paymentStatus: 'completed'
    })
      .populate('customerId', 'personalInfo location')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ paymentDate: -1 });

    const total = await Payment.countDocuments({ 
      vendorId: vendor._id,
      paymentStatus: 'completed'
    });

    // Transform data for frontend
    const customers = payments.map(payment => ({
      id: payment.customerId._id,
      name: payment.customerId.personalInfo.name,
      phone: payment.customerId.personalInfo.phone,
      location: `${payment.customerId.location.hostel} Hostel, Room ${payment.customerId.location.room}`,
      plan: {
        type: 'Monthly Veg', // This should come from subscription
        price: payment.amount
      },
      payment: {
        date: payment.paymentDate,
        amount: payment.amount,
        paymentId: payment._id
      }
    }));

    res.json({
      success: true,
      data: {
        customers,
        stats: {
          totalPaidCustomers: total
        },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching paid customers',
      error: error.message
    });
  }
};

// Get unpaid customers
exports.getUnpaidCustomers = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const Vendor = require('../models/Vendor');
    const vendor = await Vendor.findOne({ userId: vendorId });

    const unpaidCustomers = await Customer.find({ 
      vendorId: vendor._id,
      paymentStatus: { $in: ['pending', 'overdue'] }
    }).populate('userId', 'name email');

    // Mock data for demonstration
    const customers = unpaidCustomers.map(customer => ({
      id: customer._id,
      name: customer.personalInfo.name,
      phone: customer.personalInfo.phone,
      location: `${customer.location.hostel} Hostel, Room ${customer.location.room}`,
      plan: 'Monthly Veg', // This should come from subscription
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      pendingAmount: 2500,
      status: customer.paymentStatus
    }));

    const stats = {
      totalUnpaidCustomers: unpaidCustomers.length,
      overduePayments: unpaidCustomers.filter(c => c.paymentStatus === 'overdue').length,
      totalPendingAmount: unpaidCustomers.length * 2500 // Mock calculation
    };

    res.json({
      success: true,
      data: {
        customers,
        stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching unpaid customers',
      error: error.message
    });
  }
};

// Send payment reminder
exports.sendPaymentReminder = async (req, res) => {
  try {
    const { id } = req.params;
    
    // In real app, integrate with email/SMS service
    // For now, just update reminder count
    
    const payment = await Payment.findByIdAndUpdate(
      id,
      { 
        $inc: { 'reminderSent.count': 1 },
        $set: { 'reminderSent.lastSent': new Date() }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Payment reminder sent successfully',
      data: { payment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending payment reminder',
      error: error.message
    });
  }
};