const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
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
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  paymentDate: {
    type: Date,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'upi'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: String,
  receiptNumber: {
    type: String,
    unique: true
  },
  billingPeriod: {
    month: String,
    startDate: Date,
    endDate: Date
  },
  dueDate: Date,
  status: {
    type: String,
    enum: ['pending', 'overdue', 'paid', 'cancelled'],
    default: 'pending'
  },
  reminderSent: {
    count: { type: Number, default: 0 },
    lastSent: Date,
    nextReminder: Date
  },
  overdueDays: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate receipt number before saving
paymentSchema.pre('save', async function(next) {
  if (!this.receiptNumber) {
    const count = await mongoose.model('Payment').countDocuments();
    this.receiptNumber = `TT${Date.now()}${count + 1}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);