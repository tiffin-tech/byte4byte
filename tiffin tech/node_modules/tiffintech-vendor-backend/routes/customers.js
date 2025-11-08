const express = require('express');
const { 
  getCustomers, 
  getPaidCustomers, 
  getUnpaidCustomers, 
  sendPaymentReminder 
} = require('../controllers/customerController');
const { vendorAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', vendorAuth, getCustomers);
router.get('/paid', vendorAuth, getPaidCustomers);
router.get('/unpaid', vendorAuth, getUnpaidCustomers);
router.post('/:id/send-reminder', vendorAuth, sendPaymentReminder);

module.exports = router;