import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    default: null // null means "All Services"
  },
  date: {
    type: Date,
    required: true
  },
  serviceType: {
    type: String,
    enum: ['lunch', 'dinner', 'both'],
    default: 'both'
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed'],
    default: 'scheduled'
  }
}, {
  timestamps: true
});

// Prevent duplicate holidays for same user+vendor+date
holidaySchema.index({ userId: 1, vendorId: 1, date: 1 }, { unique: true });

export default mongoose.model('Holiday', holidaySchema);