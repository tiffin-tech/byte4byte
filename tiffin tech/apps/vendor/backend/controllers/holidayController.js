const Holiday = require('../models/Holiday');
const Vendor = require('../models/Vendor');

// Get vendor holidays
exports.getHolidays = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const vendor = await Vendor.findOne({ userId: vendorId });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const holidays = await Holiday.find({ vendorId: vendor._id })
      .sort({ date: 1 });

    // Transform data for FullCalendar
    const events = holidays.map(holiday => ({
      id: holiday._id,
      title: `${holiday.type} Holiday`,
      start: holiday.date.toISOString().split('T')[0],
      allDay: true,
      backgroundColor: getHolidayColor(holiday.type),
      borderColor: getHolidayColor(holiday.type),
      textColor: 'white',
      extendedProps: {
        type: holiday.type,
        description: holiday.description
      }
    }));

    res.json({
      success: true,
      data: {
        holidays,
        events
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching holidays',
      error: error.message
    });
  }
};

// Create holiday
exports.createHoliday = async (req, res) => {
  try {
    const { date, type, description, recurring } = req.body;
    const vendorId = req.user.id;

    const vendor = await Vendor.findOne({ userId: vendorId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check if holiday already exists for this date
    const existingHoliday = await Holiday.findOne({
      vendorId: vendor._id,
      date: new Date(date)
    });

    if (existingHoliday) {
      return res.status(400).json({
        success: false,
        message: 'Holiday already exists for this date'
      });
    }

    const holiday = await Holiday.create({
      vendorId: vendor._id,
      date: new Date(date),
      type,
      description,
      recurring: recurring || { isRecurring: false }
    });

    res.status(201).json({
      success: true,
      message: 'Holiday created successfully',
      data: { holiday }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating holiday',
      error: error.message
    });
  }
};

// Delete holiday
exports.deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const vendor = await Vendor.findOne({ userId: vendorId });
    const holiday = await Holiday.findById(id);

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: 'Holiday not found'
      });
    }

    // Check if vendor owns this holiday
    if (holiday.vendorId.toString() !== vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Holiday.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Holiday deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting holiday',
      error: error.message
    });
  }
};

// Update holiday
exports.updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, type, description, recurring } = req.body;
    const vendorId = req.user.id;

    const vendor = await Vendor.findOne({ userId: vendorId });
    const holiday = await Holiday.findById(id);

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: 'Holiday not found'
      });
    }

    // Check if vendor owns this holiday
    if (holiday.vendorId.toString() !== vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updatedHoliday = await Holiday.findByIdAndUpdate(
      id,
      {
        date: date ? new Date(date) : holiday.date,
        type: type || holiday.type,
        description: description || holiday.description,
        recurring: recurring || holiday.recurring
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Holiday updated successfully',
      data: { holiday: updatedHoliday }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating holiday',
      error: error.message
    });
  }
};

// Check if date is holiday
exports.checkHoliday = async (req, res) => {
  try {
    const { date } = req.query;
    const vendorId = req.user.id;

    const vendor = await Vendor.findOne({ userId: vendorId });
    const holiday = await Holiday.findOne({
      vendorId: vendor._id,
      date: new Date(date)
    });

    res.json({
      success: true,
      data: {
        isHoliday: !!holiday,
        holiday: holiday || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking holiday',
      error: error.message
    });
  }
};

// Helper function to get holiday color
function getHolidayColor(type) {
  const colors = {
    "All Day": "#ef4444",    // red
    "Afternoon": "#f59e0b",  // amber
    "Night": "#2563eb"       // blue
  };
  return colors[type] || "#6b7280";
}