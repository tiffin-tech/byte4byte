const express = require('express');
const {
  getHolidays,
  createHoliday,
  deleteHoliday,
  updateHoliday,
  checkHoliday
} = require('../controllers/holidayController');
const { vendorAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/vendor', vendorAuth, getHolidays);
router.get('/check', vendorAuth, checkHoliday);
router.post('/', vendorAuth, createHoliday);
router.put('/:id', vendorAuth, updateHoliday);
router.delete('/:id', vendorAuth, deleteHoliday);

module.exports = router;