const express = require('express');
const { 
  getRequests, 
  acceptRequest, 
  rejectRequest 
} = require('../controllers/subscriptionController');
const { vendorAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/requests', vendorAuth, getRequests);
router.post('/requests/:id/accept', vendorAuth, acceptRequest);
router.post('/requests/:id/reject', vendorAuth, rejectRequest);

module.exports = router;