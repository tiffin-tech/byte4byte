const express = require('express');
const {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementStats,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');
const { vendorAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', vendorAuth, createAnnouncement);
router.get('/', vendorAuth, getAnnouncements);
router.get('/stats', vendorAuth, getAnnouncementStats);
router.put('/:id', vendorAuth, updateAnnouncement);
router.delete('/:id', vendorAuth, deleteAnnouncement);

module.exports = router;