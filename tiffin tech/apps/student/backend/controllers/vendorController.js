// controllers/vendorController.js (ES Module Version)
import Vendor from '../models/Vendor.js';

// Helper function to map database vendor object to frontend expected format
const mapVendorToFrontend = (vendorDoc) => {
    const defaultImage = 'https://images.unsplash.com/photo-1517244683847-7456b63c5969?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';

    return {
        _id: vendorDoc._id,
        name: vendorDoc.businessInfo.serviceName || vendorDoc.personalInfo.fullName || 'Unknown Vendor',
        description: vendorDoc.businessInfo.description || 'Delicious home-cooked meals.',
        cuisineType: vendorDoc.businessInfo.cuisines[0] ? vendorDoc.businessInfo.cuisines[0].toLowerCase().replace(/\s/g, '-') : 'multi-cuisine',
        mealTypes: ['lunch', 'dinner'],
        dietaryOptions: vendorDoc.businessInfo.foodType === 'vegetarian' ? ['vegetarian'] : ['non-vegetarian'],
        priceRange: {
            monthly: { 
                min: vendorDoc.pricing.monthlyRate || 0,
                max: (vendorDoc.pricing.monthlyRate || 0) + 500
            }
        },
        images: vendorDoc.images && vendorDoc.images.length > 0 ? vendorDoc.images : [defaultImage],
        location: {
            city: vendorDoc.businessInfo.address ? vendorDoc.businessInfo.address.split(',')[1]?.trim() || 'City' : 'City',
            address: vendorDoc.businessInfo.address || 'N/A'
        },
        rating: vendorDoc.rating || 4.0, // Default to 4.0 if no rating
        reviewCount: vendorDoc.totalCustomers || 0,
        totalOrders: vendorDoc.totalCustomers || 0,
        isVerified: vendorDoc.isVerified,
        features: vendorDoc.features || ['hygienic', 'timely-delivery'],
        subscriptionSettings: {
            minSubscriptionDays: vendorDoc.subscriptionSettings?.minSubscriptionDays || 15,
            deliveryRadius: vendorDoc.subscriptionSettings?.deliveryRadius || 5
        }
    };
};

// @desc    Get all vendors with filters, search, and pagination
// @route   GET /api/vendors/list
// @access  Public
export const getVendors = async (req, res) => {
    try {
        const {
            search,
            cuisineType,
            mealType,
            dietType,
            priceMin,
            priceMax,
            page = 1,
            limit = 8,
            sortBy = 'rating',
            sortOrder = 'desc'
        } = req.query;

        // IMPORTANT: Show both approved and pending vendors
        let query = { status: { $in: ['approved', 'pending'] } };

        // Search functionality
        if (search) {
            query.$or = [
                { 'businessInfo.serviceName': { $regex: search, $options: 'i' } },
                { 'businessInfo.description': { $regex: search, $options: 'i' } },
                { 'businessInfo.address': { $regex: search, $options: 'i' } },
                { 'businessInfo.cuisines': { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by cuisine type
        if (cuisineType && cuisineType !== 'all') {
            const dbCuisine = cuisineType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            query['businessInfo.cuisines'] = { $in: [new RegExp(dbCuisine, 'i')] };
        }

        // Filter by dietary options
        if (dietType && dietType !== 'all') {
            if (dietType === 'vegetarian' || dietType === 'vegan' || dietType === 'jain') {
                query['businessInfo.foodType'] = { $in: ['vegetarian', 'both'] };
            } else if (dietType === 'non-vegetarian' || dietType === 'eggitarian') {
                query['businessInfo.foodType'] = { $in: ['non-vegetarian', 'both'] };
            }
        }

        // Filter by price range
        if (priceMin || priceMax) {
            query['pricing.monthlyRate'] = {};
            if (priceMin) query['pricing.monthlyRate'].$gte = parseFloat(priceMin);
            if (priceMax) query['pricing.monthlyRate'].$lte = parseFloat(priceMax);
        }

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const startIndex = (pageNum - 1) * limitNum;

        const totalVendors = await Vendor.countDocuments(query);
        const vendors = await Vendor.find(query)
            .sort({
                [sortBy]: sortOrder === 'desc' ? -1 : 1
            })
            .limit(limitNum)
            .skip(startIndex);

        // Map vendors to the frontend expected format
        const mappedVendors = vendors.map(mapVendorToFrontend);

        const pagination = {
            currentPage: pageNum,
            totalPages: Math.ceil(totalVendors / limitNum),
            totalVendors: totalVendors,
            hasNext: (startIndex + limitNum) < totalVendors,
            hasPrev: pageNum > 1
        };

        res.status(200).json({
            success: true,
            data: {
                vendors: mappedVendors,
                pagination
            }
        });

    } catch (error) {
        console.error('Error in getVendors:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error fetching vendors',
            error: error.message
        });
    }
};

// @desc    Get single vendor by ID
// @route   GET /api/vendors/:id
// @access  Public
export const getVendorById = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }
        
        const mappedVendor = mapVendorToFrontend(vendor);

        res.status(200).json({
            success: true,
            data: mappedVendor
        });
    } catch (error) {
        console.error('Error in getVendorById:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error fetching vendor details',
            error: error.message
        });
    }
};