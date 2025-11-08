const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['All Day', 'Afternoon', 'Night'],
    required: true
  },
  description: String,
  recurring: {
    isRecurring: { type: Boolean, default: false },
    frequency: { type: String, enum: ['weekly', 'monthly', 'yearly'] },
    endDate: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Holiday', holidaySchema);