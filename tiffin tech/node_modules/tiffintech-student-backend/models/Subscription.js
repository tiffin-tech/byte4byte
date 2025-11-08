import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
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
    durationDays: {
        type: Number,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'paused', 'cancelled', 'expired'],
        default: 'active'
    },
    totalAmount: {
        type: Number,
        required: true
    },
    mealsPerDay: {
        type: Number,
        default: 2 // lunch + dinner
    }
}, {
    timestamps: true
});

// Calculate end date before saving
subscriptionSchema.pre('save', function(next) {
    if (this.isNew) {
        this.endDate = new Date(this.startDate);
        this.endDate.setDate(this.endDate.getDate() + this.durationDays);
    }
    next();
});

export default mongoose.model('Subscription', subscriptionSchema);