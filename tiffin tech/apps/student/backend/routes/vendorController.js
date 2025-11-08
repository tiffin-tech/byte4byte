import express from 'express';
import Vendor from '../models/Vendor.js'; // You'll need to create this model

const router = express.Router();

// Get all vendors with filtering and pagination
router.get('/list', async (req, res) => {
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

        // Build filter object - SHOW PENDING VENDORS TOO
        let filter = { status: { $in: ['approved', 'pending'] } };

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
            isVerified: vendor.isVerified
        }));

        // Helper functions
        function extractCity(address) {
            if (!address) return 'City';
            const parts = address.split(',');
            return parts[parts.length - 2]?.trim() || 'City';
        }

        function getVendorFeatures(vendor) {
            const features = ['hygienic', 'timely-delivery'];
            if (vendor.personalInfo.yearsExperience > 3) features.push('experienced');
            if (vendor.isVerified) features.push('verified');
            return features;
        }

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
router.get('/:id', async (req, res) => {
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
            description: `Delicious ${vendor.businessInfo.foodType} meals by ${vendor.personalInfo.fullName}. ${vendor.personalInfo.yearsExperience} years of experience.`,
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
            deliveryRadius: 5
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

export default router;