const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  mealType: {
    type: String,
    enum: ['lunch', 'dinner'],
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'],
    default: 'scheduled'
  },
  specialInstructions: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);