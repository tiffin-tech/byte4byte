        const express = require('express');
const {
  getPaymentStats,
  getReceipt,
  createPayment,
  getPayments,
  markPaymentOverdue
} = require('../controllers/paymentController');
const { vendorAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', vendorAuth, getPaymentStats);
router.get('/:id/receipt', vendorAuth, getReceipt);
router.get('/', vendorAuth, getPayments);
router.post('/', vendorAuth, createPayment);
router.patch('/:id/overdue', vendorAuth, markPaymentOverdue);

module.exports = router;