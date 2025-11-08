import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';


// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug: Check if holidays.js file exists
const holidaysPath = path.join(__dirname, 'routes', 'holidays.js');
console.log('🔍 Looking for holidays routes at:', holidaysPath);
console.log('📁 File exists:', fs.existsSync(holidaysPath));

// Try to import holidays routes with error handling
let holidayRoutes;
try {
    const holidaysModule = await import('./routes/holidays.js');
    holidayRoutes = holidaysModule.default;
    console.log('✅ Holidays routes module loaded successfully');
} catch (error) {
    console.log('❌ Error loading holidays routes:', error.message);
    // Create a fallback router
    holidayRoutes = express.Router();
    holidayRoutes.get('*', (req, res) => {
        res.status(500).json({
            success: false,
            message: 'Holidays routes failed to load: ' + error.message
        });
    });
}

// MongoDB User Schema
const userSchema = new mongoose.Schema({
    name: {
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
    userType: {
        type: String,
        enum: ['student', 'vendor', 'admin'],
        default: 'student'
    },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String
    },
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
        allergies: [String]
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Auth Middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ success: false, message: 'Access token required' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(403).json({ success: false, message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
    }
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists with this email' 
            });
        }

        // Create new user
        const newUser = new User({
            name,
            email,
            password, // Will be hashed by pre-save middleware
            phone,
            address,
            userType: 'student'
        });

        await newUser.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser._id, email: newUser.email, userType: newUser.userType },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    userType: newUser.userType,
                    phone: newUser.phone
                },
                token
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(400).json({ 
                success: false, 
                message: 'Account is deactivated' 
            });
        }

        // Check password
        const validPassword = await user.comparePassword(password);
        if (!validPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, userType: user.userType },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    userType: user.userType,
                    phone: user.phone
                },
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login'
        });
    }
});
// Vendor Schema (Based on your MongoDB structure)
const vendorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    personalInfo: {
        fullName: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        yearsExperience: {
            type: Number,
            default: 0
        }
    },
    businessInfo: {
        serviceName: {
            type: String,
            required: true
        },
        foodType: {
            type: String,
            enum: ['vegetarian', 'non-vegetarian', 'both'],
            default: 'vegetarian'
        },
        cuisines: [String],
        address: String,
        pincode: String,
        serviceAreas: [String],
        deliveryLocations: [String],
        deliveryOptions: [String],
        paymentMethods: [String]
    },
    pricing: {
        monthlyRate: {
            type: Number,
            required: true
        },
        oneTimeRate: Number
    },
    availability: {
        weeklyHoliday: {
            type: String,
            default: 'none'
        },
        operationalHours: {
            morning: Object,
            afternoon: Object,
            night: Object
        }
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended'],
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

const Vendor = mongoose.model('Vendor', vendorSchema);

// VENDOR API ROUTES - ADD THIS SECTION

// Get all vendors with filtering and pagination
app.get('/api/vendors/list', async (req, res) => {
    try {
        const {
            search = '',
            cuisineType = 'all',
            mealType = 'all',
            priceMin,
            priceMax,
            dietType = 'all',
            page = 1,
            limit = 8,
            sortBy = 'rating',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        // Build filter object - FIX: Show both approved AND pending vendors
let filter = { };

        // Search filter
        if (search) {
            filter.$or = [
                { 'businessInfo.serviceName': { $regex: search, $options: 'i' } },
                { 'personalInfo.fullName': { $regex: search, $options: 'i' } },
                { 'businessInfo.cuisines': { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Cuisine filter
        if (cuisineType && cuisineType !== 'all') {
            filter['businessInfo.foodType'] = cuisineType;
        }

        // Diet filter
        if (dietType && dietType !== 'all') {
            filter['businessInfo.foodType'] = dietType;
        }

        // Price filter
        if (priceMin || priceMax) {
            filter['pricing.monthlyRate'] = {};
            if (priceMin) filter['pricing.monthlyRate'].$gte = parseInt(priceMin);
            if (priceMax) filter['pricing.monthlyRate'].$lte = parseInt(priceMax);
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query
        const vendors = await Vendor.find(filter)
            .populate('userId', 'name email phone')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count for pagination
        const totalVendors = await Vendor.countDocuments(filter);

        // Transform vendors to match frontend expectations
        const transformedVendors = vendors.map(vendor => ({
            _id: vendor._id,
            name: vendor.businessInfo.serviceName,
            description: `Delicious ${vendor.businessInfo.foodType} meals by ${vendor.personalInfo.fullName}. ${vendor.personalInfo.yearsExperience} years of experience.`,
            cuisineType: vendor.businessInfo.foodType,
            mealTypes: ['lunch', 'dinner'], // Default meal types
            dietaryOptions: [vendor.businessInfo.foodType],
            priceRange: {
                monthly: {
                    min: vendor.pricing.monthlyRate,
                    max: vendor.pricing.monthlyRate + 500
                }
            },
            rating: vendor.rating,
            reviewCount: Math.floor(vendor.totalCustomers * 0.3), // Estimate reviews
            totalOrders: vendor.totalCustomers,
            location: {
                city: vendor.businessInfo.address ? extractCity(vendor.businessInfo.address) : 'City',
                address: vendor.businessInfo.address
            },
            features: getVendorFeatures(vendor),
            images: [getDefaultImage(vendor.businessInfo.foodType)],
            isVerified: vendor.isVerified,
            personalInfo: vendor.personalInfo,
            businessInfo: vendor.businessInfo
        }));

        // Helper function to extract city from address
        function extractCity(address) {
            if (!address) return 'City';
            // Simple extraction - you might want to improve this
            const parts = address.split(',');
            return parts[parts.length - 2]?.trim() || 'City';
        }

        // Helper function to get vendor features
        function getVendorFeatures(vendor) {
            const features = ['hygienic', 'timely-delivery'];
            if (vendor.personalInfo.yearsExperience > 3) features.push('experienced');
            if (vendor.isVerified) features.push('verified');
            if (vendor.businessInfo.deliveryOptions && vendor.businessInfo.deliveryOptions.length > 0) {
                features.push('multiple-delivery');
            }
            return features;
        }

        // Helper function to get default image
        function getDefaultImage(foodType) {
            const images = {
                'vegetarian': 'https://images.unsplash.com/photo-1517244683847-7456b63c5969?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                'non-vegetarian': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                'both': 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
            };
            return images[foodType] || images['vegetarian'];
        }

        res.json({
            success: true,
            data: {
                vendors: transformedVendors,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalVendors / parseInt(limit)),
                    totalVendors,
                    hasNext: (parseInt(page) * parseInt(limit)) < totalVendors,
                    hasPrev: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching vendors',
            error: error.message
        });
    }
});

// Get single vendor by ID
app.get('/api/vendors/:id', async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id)
            .populate('userId', 'name email phone')
            .lean();

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        // Transform vendor data for frontend
        const transformedVendor = {
            _id: vendor._id,
            name: vendor.businessInfo.serviceName,
            description: `Delicious ${vendor.businessInfo.foodType} meals by ${vendor.personalInfo.fullName}. ${vendor.personalInfo.yearsExperience} years of experience. Serving authentic ${vendor.businessInfo.foodType} cuisine.`,
            cuisineType: vendor.businessInfo.foodType,
            mealTypes: ['lunch', 'dinner'],
            dietaryOptions: [vendor.businessInfo.foodType],
            priceRange: {
                monthly: {
                    min: vendor.pricing.monthlyRate,
                    max: vendor.pricing.monthlyRate + 500
                }
            },
            rating: vendor.rating,
            reviewCount: Math.floor(vendor.totalCustomers * 0.3),
            totalOrders: vendor.totalCustomers,
            location: {
                city: vendor.businessInfo.address ? extractCity(vendor.businessInfo.address) : 'City',
                address: vendor.businessInfo.address
            },
            features: getVendorFeatures(vendor),
            images: [getDefaultImage(vendor.businessInfo.foodType)],
            isVerified: vendor.isVerified,
            subscriptionSettings: {
                minSubscriptionDays: 15
            },
            deliveryRadius: 5,
            personalInfo: vendor.personalInfo,
            businessInfo: vendor.businessInfo,
            pricing: vendor.pricing,
            availability: vendor.availability
        };

        res.json({
            success: true,
            data: transformedVendor
        });

    } catch (error) {
        console.error('Error fetching vendor:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching vendor details',
            error: error.message
        });
    }
});
// DEBUG ROUTES - Add this after the vendor routes
app.get('/api/debug/vendors', async (req, res) => {
    try {
        const vendors = await Vendor.find({}).lean();
        console.log('📊 Raw vendors from database:', vendors);
        
        res.json({
            success: true,
            data: {
                totalVendors: vendors.length,
                vendors: vendors
            }
        });
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({
            success: false,
            message: 'Debug error',
            error: error.message
        });
    }
});

app.get('/api/debug/test', (req, res) => {
    res.json({
        success: true,
        message: 'Debug endpoint working',
        vendorsEndpoint: '/api/vendors/list should be available'
    });
});

// ===== SUBSCRIPTION ROUTES - REAL IMPLEMENTATION =====

// Subscription Schema - Add this after Vendor schema
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
        default: 2
    },
    // Add pause details
    pauseDetails: {
        pausedAt: Date,
        pauseDate: Date,
        resumeDate: Date,
        reason: String,
        notes: String
    },
    cancelledAt: {
        type: Date
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

const Subscription = mongoose.model('Subscription', subscriptionSchema);

// Calculate subscription price
function calculateSubscriptionPrice(durationDays, vendorMonthlyRate) {
    const dailyRate = vendorMonthlyRate / 30;
    return Math.round(dailyRate * durationDays);
}

// Create subscription - REAL ENDPOINT
app.post('/api/subscriptions/create', authenticateToken, async (req, res) => {
    try {
        const { vendorId, durationDays, startDate } = req.body;
        const userId = req.user._id;

        console.log('📝 Creating subscription:', { userId, vendorId, durationDays });

        // Validate input
        if (!vendorId || !durationDays) {
            return res.status(400).json({
                success: false,
                message: 'Vendor ID and duration are required'
            });
        }

        // Get vendor details to calculate price
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        // Calculate price
        const totalAmount = calculateSubscriptionPrice(durationDays, vendor.pricing.monthlyRate);

        // Create subscription in database
        const subscription = new Subscription({
            userId: userId,
            vendorId: vendorId,
            durationDays: durationDays,
            startDate: startDate ? new Date(startDate) : new Date(),
            status: 'active',
            totalAmount: totalAmount,
            mealsPerDay: 2 // Default: lunch + dinner
        });

        await subscription.save();

        console.log('✅ Subscription created:', subscription._id);

        res.json({
            success: true,
            message: 'Subscription created successfully',
            data: {
                subscription: {
                    id: subscription._id,
                    vendorName: vendor.businessInfo.serviceName,
                    durationDays: subscription.durationDays,
                    totalAmount: subscription.totalAmount,
                    startDate: subscription.startDate,
                    endDate: subscription.endDate,
                    status: subscription.status
                }
            }
        });

    } catch (error) {
        console.error('❌ Subscription creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating subscription: ' + error.message
        });
    }
});

// Get user's subscriptions
app.get('/api/subscriptions/user', authenticateToken, async (req, res) => {
    try {
        const subscriptions = await Subscription.find({ userId: req.user._id })
            .populate('vendorId')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                subscriptions: subscriptions.map(sub => ({
                    id: sub._id,
                    vendorName: sub.vendorId.businessInfo.serviceName,
                    durationDays: sub.durationDays,
                    totalAmount: sub.totalAmount,
                    startDate: sub.startDate,
                    endDate: sub.endDate,
                    status: sub.status
                }))
            }
        });

    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching subscriptions'
        });
    }
});

// Debug endpoint to check all subscriptions
app.get('/api/debug/subscriptions', async (req, res) => {
    try {
        const subscriptions = await Subscription.find({})
            .populate('userId', 'name email')
            .populate('vendorId', 'businessInfo.serviceName');
        
        res.json({
            success: true,
            data: {
                totalSubscriptions: subscriptions.length,
                subscriptions: subscriptions
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching subscriptions',
            error: error.message
        });
    }
});
// ===== SUBSCRIPTION MANAGEMENT ENDPOINTS =====

// Cancel subscription
app.post('/api/subscriptions/:id/cancel', authenticateToken, async (req, res) => {
    try {
        const subscriptionId = req.params.id;
        const userId = req.user._id;

        console.log('❌ Cancelling subscription:', { subscriptionId, userId });

        // Find the subscription
        const subscription = await Subscription.findOne({
            _id: subscriptionId,
            userId: userId
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        // Check if already cancelled
        if (subscription.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Subscription is already cancelled'
            });
        }

        // Update subscription status
        subscription.status = 'cancelled';
        subscription.cancelledAt = new Date();
        await subscription.save();

        console.log('✅ Subscription cancelled:', subscriptionId);

        res.json({
            success: true,
            message: 'Subscription cancelled successfully',
            data: {
                subscription: {
                    id: subscription._id,
                    status: subscription.status,
                    cancelledAt: subscription.cancelledAt
                }
            }
        });

    } catch (error) {
        console.error('❌ Cancel subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling subscription: ' + error.message
        });
    }
});

// Pause subscription
app.post('/api/subscriptions/:id/pause', authenticateToken, async (req, res) => {
    try {
        const subscriptionId = req.params.id;
        const userId = req.user._id;
        const { pauseDate, resumeDate, reason, notes } = req.body;

        console.log('⏸️ Pausing subscription:', { subscriptionId, userId });

        const subscription = await Subscription.findOne({
            _id: subscriptionId,
            userId: userId
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        // Update subscription status
        subscription.status = 'paused';
        subscription.pauseDetails = {
            pausedAt: new Date(),
            pauseDate: pauseDate ? new Date(pauseDate) : new Date(),
            resumeDate: resumeDate ? new Date(resumeDate) : null,
            reason: reason,
            notes: notes
        };

        await subscription.save();

        console.log('✅ Subscription paused:', subscriptionId);

        res.json({
            success: true,
            message: 'Subscription paused successfully',
            data: {
                subscription: {
                    id: subscription._id,
                    status: subscription.status,
                    pauseDetails: subscription.pauseDetails
                }
            }
        });

    } catch (error) {
        console.error('❌ Pause subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Error pausing subscription: ' + error.message
        });
    }
});

// Resume subscription
app.post('/api/subscriptions/:id/resume', authenticateToken, async (req, res) => {
    try {
        const subscriptionId = req.params.id;
        const userId = req.user._id;

        console.log('▶️ Resuming subscription:', { subscriptionId, userId });

        const subscription = await Subscription.findOne({
            _id: subscriptionId,
            userId: userId
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        if (subscription.status !== 'paused') {
            return res.status(400).json({
                success: false,
                message: 'Subscription is not paused'
            });
        }

        // Update subscription status
        subscription.status = 'active';
        subscription.pauseDetails = null;
        await subscription.save();

        console.log('✅ Subscription resumed:', subscriptionId);

        res.json({
            success: true,
            message: 'Subscription resumed successfully',
            data: {
                subscription: {
                    id: subscription._id,
                    status: subscription.status
                }
            }
        });

    } catch (error) {
        console.error('❌ Resume subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resuming subscription: ' + error.message
        });
    }
});

// Get subscription by ID (for details)
app.get('/api/subscriptions/:id', authenticateToken, async (req, res) => {
    try {
        const subscription = await Subscription.findById(req.params.id)
            .populate('vendorId')
            .populate('userId', 'name email phone');

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        // Check if user owns this subscription
        if (subscription.userId._id.toString() !== req.user._id.toString() && req.user.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: {
                subscription: {
                    id: subscription._id,
                    vendorName: subscription.vendorId.businessInfo.serviceName,
                    vendorId: subscription.vendorId._id,
                    durationDays: subscription.durationDays,
                    totalAmount: subscription.totalAmount,
                    startDate: subscription.startDate,
                    endDate: subscription.endDate,
                    status: subscription.status,
                    createdAt: subscription.createdAt,
                    pauseDetails: subscription.pauseDetails
                }
            }
        });

    } catch (error) {
        console.error('Error fetching subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching subscription details'
        });
    }
});

// Holiday routes - MUST BE AFTER AUTH ROUTES
// ===== HOLIDAYS ROUTES =====
// Add this to your server.js after the existing subscriptions routes
// GET /api/subscriptions - Alternative endpoint for frontend
app.get('/api/subscriptions', authenticateToken, async (req, res) => {
    try {
        const subscriptions = await Subscription.find({ userId: req.user._id })
            .populate('vendorId')
            .sort({ createdAt: -1 });

        // Transform data for frontend
        const transformedSubscriptions = subscriptions.map(sub => ({
            _id: sub._id,
            vendorId: {
                _id: sub.vendorId._id,
                name: sub.vendorId.businessInfo.serviceName,
                cuisine: sub.vendorId.businessInfo.foodType,
                businessInfo: sub.vendorId.businessInfo
            },
            vendorName: sub.vendorId.businessInfo.serviceName,
            durationDays: sub.durationDays,
            totalAmount: sub.totalAmount,
            startDate: sub.startDate,
            endDate: sub.endDate,
            status: sub.status,
            daysCompleted: Math.floor((Date.now() - sub.startDate) / (1000 * 60 * 60 * 24)),
            daysTotal: sub.durationDays,
            daysRemaining: Math.max(0, sub.durationDays - Math.floor((Date.now() - sub.startDate) / (1000 * 60 * 60 * 24))),
            billingCycle: 'monthly',
            price: sub.totalAmount,
            planType: 'lunch-dinner',
            spicePreference: 'medium'
        }));

        res.json({
            success: true,
            data: transformedSubscriptions
        });

    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching subscriptions'
        });
    }
});

// Public test route (NO authentication)
app.get('/api/holidays/public-test', (req, res) => {
    res.json({
        success: true,
        message: 'Holidays API public test is working!',
        timestamp: new Date().toISOString()
    });
});

// Protected holidays routes (WITH authentication)
app.use('/api/holidays', authenticateToken, holidayRoutes);
console.log('✅ Holiday routes mounted at /api/holidays');
app.use('/api/holidays', authenticateToken, holidayRoutes);
console.log('✅ Holiday routes mounted at /api/holidays');

// Get current user profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: req.user
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile'
        });
    }
});

// Update user profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const { name, phone, address, preferences } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { name, phone, address, preferences },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user: updatedUser }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating profile'
        });
    }
});

// Change password
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id);
        const validPassword = await user.comparePassword(currentPassword);

        if (!validPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error changing password'
        });
    }
});


// API Routes (protected)
app.get('/api/students/profile', authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                student: req.user
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching student profile'
        });
    }
});

// API Health Check
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'TiffinTech Backend Server is running!',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: '/api/auth',
            students: '/api/students',
            vendors: '/api/vendors',
            holidays: '/api/holidays'
        }
    });
});
// Add this to your server.js - SUBSCRIPTION API
app.post('/api/subscriptions/create', authenticateToken, async (req, res) => {
    try {
        const { vendorId, durationDays, startDate } = req.body;
        const userId = req.user._id;

        // Create subscription in database
        const subscription = new Subscription({
            userId: userId,
            vendorId: vendorId,
            durationDays: durationDays,
            startDate: startDate || new Date(),
            status: 'active',
            totalAmount: calculatePrice(durationDays) // You need to implement this
        });

        await subscription.save();

        res.json({
            success: true,
            message: 'Subscription created successfully',
            data: subscription
        });

    } catch (error) {
        console.error('Subscription creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating subscription'
        });
    }
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/register.html'));
});

app.get('/holidays', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/Manage Holidays.html'));
});

app.get('/services', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/services.html'));
});

app.get('/subscribers', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/subscribers.html'));
});

app.get('/messages', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/messages.html'));
});

app.get('/notifications', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/notification.html'));
});

app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/settings.html'));
});

// MongoDB Atlas Connection
const MONGODB_URI = 'mongodb+srv://admin:Tiffintech@cluster0.99m7vfa.mongodb.net/tiffintech?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(async () => {
    console.log('📊 MongoDB Atlas connected successfully!');
    
    // Initialize demo data
    try {
        await fetch(`http://localhost:${PORT}/api/auth/init-demo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('🎯 Demo data initialized');
    } catch (error) {
        console.log('⚠️ Demo data initialization skipped');
    }
    
    startServer();
})
.catch(err => {
    console.log('⚠️ MongoDB connection warning:', err.message);
    console.log('🚀 Server starting without database...');
    startServer();
});
function startServer() {
    app.listen(PORT, () => {
        console.log(`🎯 Server is running on port: ${PORT}`);
        console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📍 Frontend: http://localhost:${PORT}`);
        console.log(`📍 API Base: http://localhost:${PORT}/api`);
        console.log(`🔐 Login: http://localhost:${PORT}/login`);
        console.log(`👤 Register: http://localhost:${PORT}/register`);
        console.log(`📊 MongoDB: Connected to Atlas`);
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
});

// 404 handler
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `API route not found: ${req.originalUrl}`
    });
});

// Catch-all route for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

export default app;