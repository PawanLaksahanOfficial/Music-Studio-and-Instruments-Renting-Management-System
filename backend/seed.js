/**
 * Seeder — run once to bootstrap the first Admin account
 * Usage: node seeder.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

// Inline minimal model to avoid circular issues
const UserSchema = new mongoose.Schema({
    name:     { type: String, required: true },
    username: { type: String, unique: true, required: true, lowercase: true },
    password: { type: String, required: true },
    role:     { type: String, enum: ['Admin', 'Cashier'], default: 'Admin' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const seed = async () => {
    await connectDB();

    const existing = await User.findOne({ username: 'admin' });
    if (existing) {
        console.log('✅ Admin user already exists. Username: admin');
        process.exit(0);
    }

    const hashed = await bcrypt.hash('Admin@1234', 12);
    await User.create({
        name: 'System Admin',
        username: 'admin',
        password: hashed,
        role: 'Admin',
        isActive: true,
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Username : admin');
    console.log('   Password : Admin@1234');
    console.log('   ⚠️  Change the password after first login!');
    process.exit(0);
};

seed().catch(err => {
    console.error('❌ Seeder failed:', err.message);
    process.exit(1);
});