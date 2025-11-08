import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  // Reference Fields
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  
  // Thread Management
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
    // First message in thread has null threadId
  },
  isThreadStart: {
    type: Boolean,
    default: false
  },
  
  // Message Content
  type: {
    type: String,
    enum: ['student_to_vendor', 'vendor_to_student', 'support'],
    required: true
  },
  subject: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  
  // Attachments
  attachments: [{
    filename: String,
    url: String,
    type: String,
    size: Number
  }],
  
  // Status & Tracking
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  
  // Delivery Status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  deliveredAt: Date,
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Related Entities
  relatedSubscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }
}, {
  timestamps: true
});

// Index for efficient message retrieval
messageSchema.index({ studentId: 1, vendorId: 1, createdAt: -1 });
messageSchema.index({ threadId: 1, createdAt: 1 });
messageSchema.index({ isRead: 1, studentId: 1 });

// Virtual for thread message count
messageSchema.virtual('threadMessageCount', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'threadId',
  count: true
});

export default mongoose.model('Message', messageSchema);