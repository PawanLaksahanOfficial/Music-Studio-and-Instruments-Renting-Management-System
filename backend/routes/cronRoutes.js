const express = require('express');
const router = express.Router();
const cronController = require('../controllers/cronController');
const { protect, adminOnly } = require('../auth');

// Manual trigger for due date reminders
router.post('/trigger-reminders', protect, adminOnly, cronController.triggerReminders);

module.exports = router;
