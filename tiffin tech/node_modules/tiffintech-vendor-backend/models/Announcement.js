const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  title: String,
  content: {
    type: String,
    required: true
  },
  targetAudience: {
    type: {
      type: String,
      enum: ['all', 'location', 'plan', 'specific'],
      default: 'all'
    },
    locations: [{ type: String }],
    planTypes: [{ type: String }],
    customerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }]
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'cancelled'],
    default: 'draft'
  },
  scheduleDate: Date,
  sentAt: Date,
  readCount: {
    type: Number,
    default: 0
  },
  deliveryStatus: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    read: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Announcement', announcementSchema);