const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  orderDate: {
    type: Date,
    required: true
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  orderType: {
    type: String,
    enum: ['regular', 'extra'],
    default: 'regular'
  },
  mealType: {
    type: String,
    enum: ['veg', 'nonveg'],
    required: true
  },
  location: {
    hostel: { 
      type: String, 
      enum: ['A2', 'A3', 'A4', 'A5', 'Outside'],
      required: true 
    },
    room: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'prepared', 'delivered', 'cancelled', 'rejected'],
    default: 'pending'
  },
  price: {
    type: Number,
    required: true
  },
  specialInstructions: String,
  rejection: {
    reason: String,
    rejectedBy: { 
      type: String, 
      enum: ['vendor', 'customer', 'system'] 
    },
    rejectedAt: Date,
    notes: String
  },
  deliveryAttempts: {
    count: { type: Number, default: 0 },
    lastAttempt: Date,
    issues: [{ type: String }]
  },
  holidayStatus: {
    isHoliday: { type: Boolean, default: false },
    holidayType: String,
    affected: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);