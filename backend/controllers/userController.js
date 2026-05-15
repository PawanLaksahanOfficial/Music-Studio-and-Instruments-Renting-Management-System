const bcrypt = require('bcryptjs');
const User = require('../models/User');

// GET /api/users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/users  (Admin only)
exports.createUser = async (req, res) => {
    try {
        const { name, username, password, role } = req.body;
        if (!name || !username || !password) {
            return res.status(400).json({ message: 'name, username and password are required' });
        }
        const existing = await User.findOne({ username: username.toLowerCase() });
        if (existing) {
            return res.status(409).json({ message: 'Username already taken' });
        }
        const user = await User.create({ name, username, password, role });
        res.status(201).json({
            _id: user._id, name: user.name, username: user.username,
            role: user.role, isActive: user.isActive, createdAt: user.createdAt
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// PATCH /api/users/:id  (Admin only)
exports.updateUser = async (req, res) => {
    try {
        const { name, role, password } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (name) user.name = name;
        if (role) user.role = role;
        if (password) user.password = password;

        await user.save();
        res.json({
            _id: user._id, name: user.name, username: user.username,
            role: user.role, isActive: user.isActive, lastLogin: user.lastLogin
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// PATCH /api/users/:id/toggle-active  (Admin only)
exports.toggleActive = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.isActive = !user.isActive;
        await user.save();
        res.json({ isActive: user.isActive });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// DELETE /api/users/:id  (Admin only)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};