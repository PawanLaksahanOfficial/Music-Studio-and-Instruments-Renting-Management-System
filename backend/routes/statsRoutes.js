const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../auth');
const { getSummary, getMonthly } = require('../controllers/statsControler');

router.use(protect, adminOnly);
router.get('/summary', getSummary);
router.get('/monthly', getMonthly);

module.exports = router;