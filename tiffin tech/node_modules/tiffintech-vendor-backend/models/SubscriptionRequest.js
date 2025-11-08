const mongoose = require('mongoose');

const subscriptionRequestSchema = new mongoose.Schema({
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
  planType: {
    type: String,
    enum: ['monthly-veg', 'monthly-nonveg', 'one-time-veg', 'one-time-nonveg'],
    required: true
  },
  preferences: {
    mealType: { 
      type: String, 
      enum: ['veg', 'nonveg'],
      required: true 
    },
    deliveryLocation: { type: String, required: true },
    specialInstructions: String,
    startDate: { type: Date, required: true }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date,
  rejectionReason: String
}, {
  timestamps: true
});

module.exports = mongoose.model('SubscriptionRequest', subscriptionRequestSchema);