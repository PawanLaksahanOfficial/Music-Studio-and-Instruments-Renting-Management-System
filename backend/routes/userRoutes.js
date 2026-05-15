const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../auth');
const { getAllUsers, createUser, updateUser, toggleActive, deleteUser} = require('../controllers/userController');

router.use(protect, adminOnly);
router.get('/', getAllUsers);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.patch('/:id/toggle-active', toggleActive);
router.delete('/:id', deleteUser);

module.exports = router;