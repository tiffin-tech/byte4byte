import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    personalInfo: {
        fullName: String,
        phone: String,
        email: String,
        yearsExperience: Number
    },
    businessInfo: {
        serviceName: String,
        foodType: String,
        cuisines: [String],
        address: String,
        pincode: String,
        serviceAreas: [String],
        deliveryLocations: [String],
        deliveryOptions: [String],
        paymentMethods: [String]
    },
    pricing: {
        monthlyRate: Number,
        oneTimeRate: Number
    },
    availability: {
        weeklyHoliday: String,
        operationalHours: {
            morning: Object,
            afternoon: Object,
            night: Object
        }
    },
    status: {
        type: String,
        default: 'pending'
    },
    rating: {
        type: Number,
        default: 0
    },
    totalCustomers: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default mongoose.model('Vendor', vendorSchema);