const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../auth');
const { getAllCustomers, getCustomerById, createCustomer, updateCustomer, toggleBlacklist, deleteCustomer} = require('../controllers/customerController');

router.use(protect);

router.get('/', getAllCustomers);
router.get('/:id', getCustomerById);
router.post('/', adminOnly, createCustomer);
router.patch('/:id', adminOnly, updateCustomer);
router.patch('/:id/blacklist', adminOnly, toggleBlacklist);
router.delete('/:id', adminOnly,  deleteCustomer);

module.exports = router;