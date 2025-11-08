const Announcement = require('../models/Announcement');
const Vendor = require('../models/Vendor');

// Create announcement
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, targetAudience, scheduleDate } = req.body;
    const vendorId = req.user.id;

    const vendor = await Vendor.findOne({ userId: vendorId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const announcement = await Announcement.create({
      vendorId: vendor._id,
      title,
      content,
      targetAudience: targetAudience || { type: 'all' },
      status: scheduleDate ? 'scheduled' : 'sent',
      scheduleDate: scheduleDate || new Date(),
      sentAt: !scheduleDate ? new Date() : null
    });

    res.status(201).json({
      success: true,
      message: scheduleDate ? 'Announcement scheduled' : 'Announcement sent successfully',
      data: { announcement }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating announcement',
      error: error.message
    });
  }
};

// Get vendor announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const vendorId = req.user.id;

    const vendor = await Vendor.findOne({ userId: vendorId });
    let query = { vendorId: vendor._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    const announcements = await Announcement.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Announcement.countDocuments(query);

    // Transform data for frontend
    const announcementList = announcements.map(announcement => ({
      id: announcement._id,
      title: announcement.title || 'Announcement',
      content: announcement.content,
      status: announcement.status,
      sentAt: announcement.sentAt || announcement.createdAt,
      targetAudience: announcement.targetAudience,
      readCount: announcement.readCount
    }));

    res.json({
      success: true,
      data: {
        announcements: announcementList,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching announcements',
      error: error.message
    });
  }
};

// Get announcement statistics
exports.getAnnouncementStats = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const vendor = await Vendor.findOne({ userId: vendorId });

    const totalAnnouncements = await Announcement.countDocuments({ 
      vendorId: vendor._id 
    });
    
    const sentThisMonth = await Announcement.countDocuments({
      vendorId: vendor._id,
      status: 'sent',
      sentAt: { 
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
      }
    });

    const scheduled = await Announcement.countDocuments({
      vendorId: vendor._id,
      status: 'scheduled'
    });

    res.json({
      success: true,
      data: {
        totalAnnouncements,
        sentThisMonth,
        scheduled
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching announcement stats',
      error: error.message
    });
  }
};

// Update announcement
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, targetAudience, scheduleDate, status } = req.body;
    const vendorId = req.user.id;

    const vendor = await Vendor.findOne({ userId: vendorId });
    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if vendor owns this announcement
    if (announcement.vendorId.toString() !== vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (targetAudience) updateData.targetAudience = targetAudience;
    if (scheduleDate) updateData.scheduleDate = scheduleDate;
    if (status) {
      updateData.status = status;
      if (status === 'sent' && !announcement.sentAt) {
        updateData.sentAt = new Date();
      }
    }

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: { announcement: updatedAnnouncement }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating announcement',
      error: error.message
    });
  }
};

// Delete announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const vendor = await Vendor.findOne({ userId: vendorId });
    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if vendor owns this announcement
    if (announcement.vendorId.toString() !== vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Announcement.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting announcement',
      error: error.message
    });
  }
};