const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
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
    enum: ['active', 'paused', 'cancelled', 'completed'],
    default: 'active'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  price: {
    type: Number,
    required: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'weekly', 'one-time'],
    default: 'monthly'
  }
}, {
  timestamps: true
});

// Calculate end date based on plan type
subscriptionSchema.pre('save', function(next) {
  if (this.planType.startsWith('monthly')) {
    this.endDate = new Date(this.startDate);
    this.endDate.setMonth(this.endDate.getMonth() + 1);
  } else if (this.planType.startsWith('one-time')) {
    this.endDate = new Date(this.startDate);
    this.endDate.setDate(this.endDate.getDate() + 1);
  }
  
  // Set price based on plan type
  if (!this.price) {
    if (this.planType === 'monthly-veg') {
      this.price = 2500;
    } else if (this.planType === 'monthly-nonveg') {
      this.price = 3000;
    } else if (this.planType === 'one-time-veg') {
      this.price = 120;
    } else if (this.planType === 'one-time-nonveg') {
      this.price = 150;
    }
  }
  
  next();
});

module.exports = mongoose.model('Subscription', subscriptionSchema);