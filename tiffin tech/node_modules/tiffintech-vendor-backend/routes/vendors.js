const express = require('express');
const { 
  completeRegistration, 
  getProfile, 
  getDashboardStats, 
  updateProfile 
} = require('../controllers/vendorController');
const { vendorAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/complete-registration', vendorAuth, completeRegistration);
router.get('/profile', vendorAuth, getProfile);
router.put('/profile', vendorAuth, updateProfile);
router.get('/dashboard/stats', vendorAuth, getDashboardStats);

module.exports = router;