const Order = require('../models/Order');
const Vendor = require('../models/Vendor');

// Get location-wise order breakdown
exports.getLocationBreakdown = async (req, res) => {
  try {
    const { date, type, period } = req.query;
    const vendorId = req.user.id;

    const vendor = await Vendor.findOne({ userId: vendorId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Build query for orders
    const query = { vendorId: vendor._id };
    
    // Date filter
    if (date) {
      const targetDate = new Date(date);
      query.deliveryDate = {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lte: new Date(targetDate.setHours(23, 59, 59, 999))
      };
    } else {
      // Default to today
      const today = new Date();
      query.deliveryDate = {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lte: new Date(today.setHours(23, 59, 59, 999))
      };
    }

    // Order type filter
    if (type && type !== 'all') {
      query.mealType = type;
    }

    // Period filter (today vs extra)
    if (period === 'today') {
      query.orderType = 'regular';
    } else if (period === 'extra') {
      query.orderType = 'extra';
    }

    // Get orders and aggregate by location
    const orders = await Order.find(query);
    
    // Aggregate by location
    const locationBreakdown = {};
    const allLocations = ['A2', 'A3', 'A4', 'A5', 'Outside'];
    
    // Initialize all locations
    allLocations.forEach(location => {
      locationBreakdown[location] = {
        vegOrders: 0,
        nonVegOrders: 0,
        totalOrders: 0
      };
    });

    // Count orders by location and meal type
    orders.forEach(order => {
      const location = order.location.hostel;
      if (locationBreakdown[location]) {
        if (order.mealType === 'veg') {
          locationBreakdown[location].vegOrders++;
        } else {
          locationBreakdown[location].nonVegOrders++;
        }
        locationBreakdown[location].totalOrders++;
      }
    });

    // Convert to array format for frontend
    const breakdown = Object.keys(locationBreakdown).map(location => ({
      location: `${location} ${location === 'Outside' ? 'Campus' : 'Hostel'}`,
      vegOrders: locationBreakdown[location].vegOrders,
      nonVegOrders: locationBreakdown[location].nonVegOrders,
      totalOrders: locationBreakdown[location].totalOrders
    }));

    const totalOrders = orders.length;

    res.json({
      success: true,
      data: {
        date: date || new Date().toISOString().split('T')[0],
        orderType: type || 'all',
        period: period || 'today',
        totalOrders,
        breakdown
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order breakdown',
      error: error.message
    });
  }
};

// Get today's orders summary
exports.getTodaysOrders = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const vendor = await Vendor.findOne({ userId: vendorId });

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const orders = await Order.find({
      vendorId: vendor._id,
      deliveryDate: { $gte: startOfDay, $lte: endOfDay },
      orderType: 'regular'
    });

    const vegOrders = orders.filter(order => order.mealType === 'veg').length;
    const nonVegOrders = orders.filter(order => order.mealType === 'nonveg').length;

    res.json({
      success: true,
      data: {
        vegOrders,
        nonVegOrders,
        totalOrders: orders.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s orders',
      error: error.message
    });
  }
};

// Get extra orders summary
exports.getExtraOrders = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const vendor = await Vendor.findOne({ userId: vendorId });

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const orders = await Order.find({
      vendorId: vendor._id,
      deliveryDate: { $gte: startOfDay, $lte: endOfDay },
      orderType: 'extra'
    });

    const vegOrders = orders.filter(order => order.mealType === 'veg').length;
    const nonVegOrders = orders.filter(order => order.mealType === 'nonveg').length;

    res.json({
      success: true,
      data: {
        vegOrders,
        nonVegOrders,
        totalOrders: orders.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching extra orders',
      error: error.message
    });
  }
};

// Get rejected orders
exports.getRejectedOrders = async (req, res) => {
  try {
    const { date } = req.query;
    const vendorId = req.user.id;

    const vendor = await Vendor.findOne({ userId: vendorId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const query = { 
      vendorId: vendor._id, 
      status: 'rejected' 
    };

    if (date) {
      const targetDate = new Date(date);
      query.deliveryDate = {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lte: new Date(targetDate.setHours(23, 59, 59, 999))
      };
    } else {
      // Default to today
      const today = new Date();
      query.deliveryDate = {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lte: new Date(today.setHours(23, 59, 59, 999))
      };
    }

    const rejectedOrders = await Order.find(query)
      .populate('customerId', 'personalInfo')
      .sort({ deliveryDate: -1 });

    // Transform data for frontend
    const orders = rejectedOrders.map(order => ({
      id: order._id,
      name: order.customerId.personalInfo.name,
      orderId: `ORD${order._id.toString().slice(-6).toUpperCase()}`,
      reason: order.rejection?.reason || 'Not specified',
      date: order.deliveryDate.toISOString().split('T')[0],
      mealType: order.mealType,
      location: `${order.location.hostel} Hostel, Room ${order.location.room}`
    }));

    res.json({
      success: true,
      data: {
        orders,
        total: rejectedOrders.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching rejected orders',
      error: error.message
    });
  }
};

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const { customerId, deliveryDate, mealType, location, orderType, specialInstructions } = req.body;
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

    // Calculate price based on meal type and order type
    let price = 0;
    if (orderType === 'regular') {
      price = mealType === 'veg' ? vendor.pricing.monthlyRate / 30 : vendor.pricing.monthlyRate / 30 * 1.2;
    } else {
      price = mealType === 'veg' ? vendor.pricing.oneTimeRate : vendor.pricing.oneTimeRate * 1.2;
    }

    const order = await Order.create({
      customerId,
      vendorId: vendor._id,
      deliveryDate: new Date(deliveryDate),
      mealType,
      location,
      orderType: orderType || 'regular',
      price: Math.round(price),
      specialInstructions,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const vendorId = req.user.id;

    const vendor = await Vendor.findOne({ userId: vendorId });
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if vendor owns this order
    if (order.vendorId.toString() !== vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updateData = { status };
    
    if (status === 'rejected' && rejectionReason) {
      updateData.rejection = {
        reason: rejectionReason,
        rejectedBy: 'vendor',
        rejectedAt: new Date()
      };
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: `Order ${status} successfully`,
      data: { order: updatedOrder }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};