import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const studentSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  
  // Address Information
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Profile
  profileImage: {
    type: String,
    default: ''
  },
  dateOfBirth: {
    type: Date
  },
  
  // Preferences (from settings.html)
  preferences: {
    dietType: {
      type: String,
      enum: ['vegetarian', 'vegan', 'jain', 'eggitarian', 'non-vegetarian'],
      default: 'vegetarian'
    },
    spiceLevel: {
      type: String,
      enum: ['mild', 'medium', 'spicy', 'very-spicy'],
      default: 'medium'
    },
    allergies: [{
      type: String,
      enum: ['gluten', 'dairy', 'nuts', 'soy', 'eggs', 'seafood']
    }],
    deliveryInstructions: {
      type: String,
      default: ''
    },
    preferredDeliveryTime: {
      type: String,
      default: '19:30-20:00'
    },
    language: {
      type: String,
      enum: ['english', 'hindi', 'kannada', 'tamil', 'telugu'],
      default: 'english'
    }
  },
  
  // Settings (from settings.html)
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
      accountAlerts: { type: Boolean, default: true },
      serviceUpdates: { type: Boolean, default: true }
    },
    privacy: {
      twoFactorAuth: { type: Boolean, default: false },
      dataCollection: { type: Boolean, default: true },
      personalizedAds: { type: Boolean, default: true }
    }
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
studentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
studentSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
studentSchema.methods.toJSON = function() {
  const student = this.toObject();
  delete student.password;
  return student;
};

export default mongoose.model('Student', studentSchema);