import express from 'express';
import Vendor from '../models/Vendor.js';
import { auth, vendorAuth } from '../middleware/auth.js';
// routes/vendors.js
import { getVendors, getVendorById } from '../controllers/vendorController.js';

const router = express.Router();

router.get('/list', getVendors);
router.get('/:id', getVendorById);



// Your vendor routes here
router.get('/', auth, (req, res) => {
  res.json({ message: 'Vendors route working!' });
});

// Get all vendors with filtering (for services.html)
router.get('/list', async (req, res) => {
  try {
    const {
      search,
      cuisineType,
      mealType,
      priceMin,
      priceMax,
      dietType,
      page = 1,
      limit = 10,
      sortBy = 'rating',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    let filter = { isActive: true };
    
    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Cuisine filter
    if (cuisineType && cuisineType !== 'all') {
      filter.cuisineType = cuisineType;
    }

    // Meal type filter
    if (mealType && mealType !== 'all') {
      filter.mealTypes = mealType;
    }

    // Price range filter
    if (priceMin || priceMax) {
      filter['priceRange.monthly.min'] = {
        $gte: parseInt(priceMin) || 0,
        $lte: parseInt(priceMax) || 10000
      };
    }

    // Diet type filter
    if (dietType && dietType !== 'all') {
      filter.dietaryOptions = dietType;
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const vendors = await Vendor.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password'); // Exclude password

    const totalVendors = await Vendor.countDocuments(filter);

    res.json({
      success: true,
      data: {
        vendors,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalVendors / limit),
          totalVendors,
          hasNext: skip + vendors.length < totalVendors,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Vendors fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single vendor details
router.get('/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .select('-password')
      .populate('menu');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      data: vendor
    });

  } catch (error) {
    console.error('Vendor details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get vendor menu
router.get('/:id/menu', async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).select('menu');
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      data: vendor.menu
    });

  } catch (error) {
    console.error('Menu fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search vendors by location (future enhancement)
router.get('/search/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query; // radius in km

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const vendors = await Vendor.find({
      isActive: true,
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    }).select('-password');

    res.json({
      success: true,
      data: vendors
    });

  } catch (error) {
    console.error('Nearby vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;