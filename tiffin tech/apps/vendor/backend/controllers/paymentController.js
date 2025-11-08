const Payment = require('../models/Payment');
const Vendor = require('../models/Vendor');

// Get payment statistics
exports.getPaymentStats = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const vendor = await Vendor.findOne({ userId: vendorId });

    // Get current month payments
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const payments = await Payment.find({
      vendorId: vendor._id,
      paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
      paymentStatus: 'completed'
    });

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Get paid customers count
    const paidCustomers = await Payment.distinct('customerId', {
      vendorId: vendor._id,
      paymentStatus: 'completed',
      paymentDate: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Get pending payments count
    const pendingPayments = await Payment.countDocuments({
      vendorId: vendor._id,
      paymentStatus: 'pending'
    });

    res.json({
      success: true,
      data: {
        paidCustomers: paidCustomers.length,
        pendingPayments,
        monthlyRevenue: totalRevenue,
        totalRevenue: vendor.totalRevenue || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment stats',
      error: error.message
    });
  }
};

// Get payment receipt
exports.getReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const vendor = await Vendor.findOne({ userId: vendorId });
    const payment = await Payment.findById(id)
      .populate('customerId', 'personalInfo location')
      .populate('vendorId', 'businessInfo');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if vendor owns this payment
    if (payment.vendorId._id.toString() !== vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Generate receipt data
    const receiptData = {
      receiptNumber: payment.receiptNumber,
      date: payment.paymentDate.toLocaleDateString('en-IN'),
      customerName: payment.customerId.personalInfo.name,
      customerPhone: payment.customerId.personalInfo.phone,
      customerLocation: `${payment.customerId.location.hostel} Hostel, Room ${payment.customerId.location.room}`,
      vendorName: payment.vendorId.businessInfo.serviceName,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId || 'N/A',
      billingPeriod: payment.billingPeriod?.month || 'Current Month'
    };

    res.json({
      success: true,
      data: {
        receipt: receiptData,
        payment
      },
      message: 'Receipt data retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating receipt',
      error: error.message
    });
  }
};

// Create new payment
exports.createPayment = async (req, res) => {
  try {
    const { customerId, amount, paymentMethod, billingPeriod, transactionId } = req.body;
    const vendorId = req.user.id;

    const vendor = await Vendor.findOne({ userId: vendorId });
    const Customer = require('../models/Customer');
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const payment = await Payment.create({
      customerId,
      vendorId: vendor._id,
      amount,
      paymentMethod,
      paymentDate: new Date(),
      paymentStatus: 'completed',
      transactionId,
      billingPeriod: {
        month: billingPeriod,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
      }
    });

    // Update customer payment status
    customer.paymentStatus = 'paid';
    customer.lastPaymentDate = new Date();
    customer.nextPaymentDate = new Date(new Date().setMonth(new Date().getMonth() + 1));
    await customer.save();

    // Update vendor total revenue
    vendor.totalRevenue = (vendor.totalRevenue || 0) + amount;
    await vendor.save();

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: { payment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating payment',
      error: error.message
    });
  }
};

// Get all payments with filters
exports.getPayments = async (req, res) => {
  try {
    const { month, paymentMethod, page = 1, limit = 10 } = req.query;
    const vendorId = req.user.id;

    const vendor = await Vendor.findOne({ userId: vendorId });
    let query = { vendorId: vendor._id, paymentStatus: 'completed' };

    // Month filter
    if (month && month !== 'All Months') {
      const [monthName, year] = month.split(' ');
      const monthIndex = new Date(Date.parse(monthName + " 1, 2012")).getMonth();
      const startDate = new Date(year, monthIndex, 1);
      const endDate = new Date(year, monthIndex + 1, 0);
      
      query.paymentDate = { $gte: startDate, $lte: endDate };
    }

    // Payment method filter
    if (paymentMethod && paymentMethod !== 'All Methods') {
      query.paymentMethod = paymentMethod.toLowerCase();
    }

    const payments = await Payment.find(query)
      .populate('customerId', 'personalInfo location')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ paymentDate: -1 });

    const total = await Payment.countDocuments(query);

    // Transform data for frontend
    const paymentList = payments.map(payment => ({
      id: payment._id,
      customer: {
        name: payment.customerId.personalInfo.name,
        phone: payment.customerId.personalInfo.phone,
        avatar: payment.customerId.personalInfo.avatarInitials
      },
      location: `${payment.customerId.location.hostel} Hostel, Room ${payment.customerId.location.room}`,
      plan: {
        type: 'Monthly Veg', // This should come from subscription
        period: payment.billingPeriod?.month
      },
      paymentDate: payment.paymentDate.toISOString().split('T')[0],
      amount: payment.amount,
      receiptNumber: payment.receiptNumber
    }));

    res.json({
      success: true,
      data: {
        payments: paymentList,
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
      message: 'Error fetching payments',
      error: error.message
    });
  }
};

// Mark payment as overdue
exports.markPaymentOverdue = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const vendor = await Vendor.findOne({ userId: vendorId });
    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if vendor owns this payment
    if (payment.vendorId.toString() !== vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    payment.status = 'overdue';
    payment.overdueDays = Math.max(payment.overdueDays || 0, 1);
    await payment.save();

    // Update customer payment status
    const Customer = require('../models/Customer');
    await Customer.findByIdAndUpdate(payment.customerId, { 
      paymentStatus: 'overdue' 
    });

    res.json({
      success: true,
      message: 'Payment marked as overdue',
      data: { payment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating payment status',
      error: error.message
    });
  }
};