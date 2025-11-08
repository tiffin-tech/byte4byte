import express from 'express';
import Holiday from '../models/Holiday.js';

const router = express.Router();

// Test route without authentication
router.get('/public-test', (req, res) => {
    res.json({
        success: true,
        message: 'Holidays API public test is working!',
        timestamp: new Date().toISOString()
    });
});

// Get all holidays for current user - FIXED: Use req.userId
router.get('/', async (req, res) => {
    try {
        console.log('📅 Fetching holidays for user:', req.userId);
        
        const holidays = await Holiday.find({ userId: req.userId })
            .populate('vendorId', 'name cuisine')
            .sort({ date: 1 });

        console.log(`📅 Found ${holidays.length} holidays`);

        res.json({
            success: true,
            data: holidays
        });
    } catch (error) {
        console.error('Error fetching holidays:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching holidays',
            error: error.message
        });
    }
});

// Schedule new holiday(s) - FIXED: Use req.userId
router.post('/', async (req, res) => {
    try {
        const { vendorId, date, dates, serviceType, reason } = req.body;
        
        console.log('📝 Scheduling holiday for user:', req.userId);
        console.log('📦 Request data:', { vendorId, date, dates, serviceType, reason });
        
        // Support both single date and multiple dates
        const dateArray = dates || (date ? [date] : []);
        
        if (!dateArray.length) {
            return res.status(400).json({
                success: false,
                message: 'Date or dates array is required'
            });
        }

        const results = [];
        const errors = [];

        // Process each date
        for (const dateStr of dateArray) {
            try {
                const holidayDate = new Date(dateStr);
                const now = new Date();
                const minDate = new Date(now.setDate(now.getDate() + 1));
                minDate.setHours(0, 0, 0, 0);
                
                // Validate date
                if (holidayDate < minDate) {
                    errors.push(`Date ${dateStr} must be at least 24 hours in advance`);
                    continue;
                }

                // Check if holiday already exists
                const existingHoliday = await Holiday.findOne({
                    userId: req.userId, // FIXED: Use req.userId
                    vendorId: vendorId || { $exists: true },
                    date: holidayDate
                });

                if (existingHoliday) {
                    errors.push(`Holiday already exists for ${dateStr}`);
                    continue;
                }

                // Create new holiday
                const holiday = new Holiday({
                    userId: req.userId, // FIXED: Use req.userId
                    vendorId: vendorId || null, // null means "all services"
                    date: holidayDate,
                    serviceType: serviceType || 'both',
                    reason: reason || 'Holiday'
                });

                await holiday.save();
                
                // Populate vendor info if vendorId exists
                if (holiday.vendorId) {
                    await holiday.populate('vendorId', 'name cuisine');
                }
                
                results.push(holiday);
                console.log('✅ Holiday scheduled:', holiday._id);

            } catch (error) {
                console.error(`❌ Error scheduling holiday for ${dateStr}:`, error);
                errors.push(`Error for ${dateStr}: ${error.message}`);
            }
        }

        const response = {
            success: errors.length === 0,
            message: errors.length === 0 ? 
                `Successfully scheduled ${results.length} holiday(s)` :
                `Scheduled ${results.length} holiday(s) with ${errors.length} error(s)`,
            data: results
        };

        if (errors.length > 0) {
            response.errors = errors;
        }

        console.log('📊 Holiday scheduling result:', response);

        res.status(201).json(response);

    } catch (error) {
        console.error('❌ Error scheduling holidays:', error);
        res.status(500).json({
            success: false,
            message: 'Error scheduling holidays',
            error: error.message
        });
    }
});

// Update holiday - FIXED: Use req.userId
router.put('/:id', async (req, res) => {
    try {
        const { date, serviceType, reason } = req.body;

        const holiday = await Holiday.findOne({
            _id: req.params.id,
            userId: req.userId // FIXED: Use req.userId
        });

        if (!holiday) {
            return res.status(404).json({
                success: false,
                message: 'Holiday not found'
            });
        }

        // Validate date if provided
        if (date) {
            const holidayDate = new Date(date);
            const now = new Date();
            const minDate = new Date(now.setDate(now.getDate() + 1));

            if (holidayDate < minDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Holidays must be scheduled at least 24 hours in advance'
                });
            }
            holiday.date = holidayDate;
        }

        if (serviceType) holiday.serviceType = serviceType;
        if (reason) holiday.reason = reason;

        await holiday.save();
        
        if (holiday.vendorId) {
            await holiday.populate('vendorId', 'name cuisine');
        }

        res.json({
            success: true,
            message: 'Holiday updated successfully',
            data: holiday
        });

    } catch (error) {
        console.error('Error updating holiday:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating holiday',
            error: error.message
        });
    }
});

// Delete holiday - FIXED: Use req.userId
router.delete('/:id', async (req, res) => {
    try {
        console.log('🗑️ Deleting holiday:', req.params.id, 'for user:', req.userId);

        const holiday = await Holiday.findOne({
            _id: req.params.id,
            userId: req.userId // FIXED: Use req.userId
        });

        if (!holiday) {
            return res.status(404).json({
                success: false,
                message: 'Holiday not found'
            });
        }

        // Check if holiday can be deleted (at least 24 hours in advance)
        const now = new Date();
        const holidayDate = new Date(holiday.date);
        const minDeleteTime = new Date(now.setDate(now.getDate() + 1));
        minDeleteTime.setHours(0, 0, 0, 0);

        if (holidayDate < minDeleteTime) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete holiday less than 24 hours in advance'
            });
        }

        await Holiday.findByIdAndDelete(req.params.id);

        console.log('✅ Holiday deleted:', req.params.id);

        res.json({
            success: true,
            message: 'Holiday deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting holiday:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting holiday',
            error: error.message
        });
    }
});
// Get all holidays for current user
router.get('/', async (req, res) => {
    try {
        console.log('📅 Fetching holidays for user:', req.userId);
        
        const holidays = await Holiday.find({ userId: req.userId })
            .populate('vendorId', 'name cuisine')
            .sort({ date: 1 });

        console.log(`📅 Found ${holidays.length} holidays`);

        res.json({
            success: true,
            data: holidays
        });
    } catch (error) {
        console.error('Error fetching holidays:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching holidays',
            error: error.message
        });
    }
});


// Get holidays by month - FIXED: Use req.userId
router.get('/month/:year/:month', async (req, res) => {
    try {
        const { year, month } = req.params;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const holidays = await Holiday.find({
            userId: req.userId, // FIXED: Use req.userId
            date: {
                $gte: startDate,
                $lte: endDate
            }
        }).populate('vendorId', 'name cuisine');

        res.json({
            success: true,
            data: holidays
        });

    } catch (error) {
        console.error('Error fetching monthly holidays:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching monthly holidays',
            error: error.message
        });
    }
});

export default router;