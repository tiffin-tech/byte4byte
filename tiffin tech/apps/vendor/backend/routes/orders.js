const express = require('express');
const {
  getLocationBreakdown,
  getTodaysOrders,
  getExtraOrders,
  getRejectedOrders,
  createOrder,
  updateOrderStatus
} = require('../controllers/orderController');
const { vendorAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/location-breakdown', vendorAuth, getLocationBreakdown);
router.get('/today', vendorAuth, getTodaysOrders);
router.get('/extra', vendorAuth, getExtraOrders);
router.get('/rejected', vendorAuth, getRejectedOrders);
router.post('/', vendorAuth, createOrder);
router.patch('/:id/status', vendorAuth, updateOrderStatus);

module.exports = router;