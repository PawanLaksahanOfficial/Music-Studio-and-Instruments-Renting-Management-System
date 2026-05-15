const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name:      { type: String, required: true, trim: true },
    username:  { type: String, unique: true, required: true, trim: true, lowercase: true },
    password:  { type: String, required: true },
    role:      { type: String, enum: ['Admin', 'Cashier'], default: 'Cashier' },
    lastLogin: Date,
    isActive:  { type: Boolean, default: true }
}, { timestamps: true });

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);