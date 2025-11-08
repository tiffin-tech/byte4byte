import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // Reference Fields
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  
  // Notification Content
  type: {
    type: String,
    required: true,
    enum: [
      'order',           // Order updates
      'payment',         // Payment status
      'subscription',    // Subscription changes
      'message',         // New messages
      'system',          // System announcements
      'promotion',       // Offers & discounts
      'holiday',         // Holiday reminders
      'vendor'           // Vendor updates
    ]
  },
  category: {
    type: String,
    enum: ['orders', 'payments', 'system', 'messages', 'promotions'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  
  // Action & Navigation
  actionUrl: {
    type: String
    // URL to navigate when notification is clicked
  },
  actionLabel: {
    type: String
    // e.g., "View Order", "Reply", "Update"
  },
  
  // Metadata
  metadata: {
    // Flexible object to store additional data
    orderId: mongoose.Schema.Types.ObjectId,
    subscriptionId: mongoose.Schema.Types.ObjectId,
    vendorId: mongoose.Schema.Types.ObjectId,
    messageId: mongoose.Schema.Types.ObjectId,
    amount: Number,
    // ... other relevant data
  },
  
  // Priority & Importance
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  isImportant: {
    type: Boolean,
    default: false
  },
  
  // Delivery Status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  
  // Expiration
  expiresAt: {
    type: Date
    // Notifications auto-delete after expiration
  },
  
  // Delivery Channels
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: false }
  },
  deliveredChannels: [{
    type: String,
    enum: ['inApp', 'email', 'sms', 'push']
  }]
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ studentId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ category: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to set expiration (30 days default)
notificationSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }
  next();
});

export default mongoose.model('Notification', notificationSchema);