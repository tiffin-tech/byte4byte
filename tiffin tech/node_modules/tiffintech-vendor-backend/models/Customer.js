const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  personalInfo: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    avatarInitials: { type: String, required: true }
  },
  location: {
    hostel: { 
      type: String, 
      enum: ['A2', 'A3', 'A4', 'A5', 'Outside'],
      required: true 
    },
    room: { type: String, required: true }
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'overdue', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Customer', customerSchema);