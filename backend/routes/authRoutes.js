const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const { protect } = require('../auth');

router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;