    const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  personalInfo: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    yearsExperience: { type: Number, default: 0 }
  },
  businessInfo: {
    serviceName: { type: String, required: true },
    foodType: { 
      type: String, 
      enum: ['veg', 'nonveg', 'both'],
      required: true 
    },
    address: { type: String, required: true },
    pincode: { type: String, required: true },
    deliveryLocations: [{ type: String }]
  },
  pricing: {
    monthlyRate: { type: Number, required: true },
    oneTimeRate: { type: Number, required: true }
  },
  availability: {
    weeklyHoliday: { 
      type: String, 
      enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'none'],
      required: true 
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Vendor', vendorSchema);