const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Inventory = require('./models/Inventory');
const Customer = require('./models/Customer');
const ProductRental = require('./models/ProductRental');

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for Seeding...");

        // 1. WIPE COLLECTIONS
        // This ensures old documents without 'isDeleted' are removed
        await Customer.deleteMany({});
        await Inventory.deleteMany({});
        await ProductRental.deleteMany({});
        console.log("Cleanup complete.");

        // 2. CREATE CUSTOMERS
        const customers = await Customer.insertMany([
            { firstName: "Pawan", lastName: "Engineer", email: "pawan@example.com", phone: "0771112223", nicOrPassport: "1995001V" },
            { firstName: "Kasun", lastName: "Perera", email: "kasun@example.com", phone: "0772223334", nicOrPassport: "1992002V" },
            { firstName: "Anjali", lastName: "Silva", email: "anjali@example.com", phone: "0773334445", nicOrPassport: "1998003V" }
        ]);

        // 3. CREATE INVENTORY
        const items = await Inventory.insertMany([
            { itemName: "Yamaha FG800", category: "Instruments", serialNumber: "SN-YAM-001", qrCodeId: "QR-YAM-001", baseRentalPrice: 1500, status: "Rented" },
            { itemName: "Fender Strat", category: "Instruments", serialNumber: "SN-FEN-002", qrCodeId: "QR-FEN-002", baseRentalPrice: 2500, status: "Available" },
            { itemName: "Shure SM58", category: "Audio Gear", serialNumber: "SN-SHU-003", qrCodeId: "QR-SHU-003", baseRentalPrice: 800, status: "Available" }
        ]);

        // 4. CREATE RENTALS (Now with isDeleted field)
        const rentals = [
            {
                customer: customers[0]._id,
                items: [{ itemId: items[0]._id, quantity: 1 }],
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                totalAmount: 1500,
                status: 'Rented',
                paymentStatus: 'Paid',
                isDeleted: false // Explicitly setting it, though schema default handles it
            },
            {
                customer: customers[1]._id,
                items: [{ itemId: items[1]._id, quantity: 1 }],
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                totalAmount: 2500,
                status: 'Rented',
                paymentStatus: 'Pending',
                isDeleted: false
            }
        ];

        await ProductRental.insertMany(rentals);

        console.log("--- Seeding Success ---");
        console.log("Added Customers, Inventory, and Active Rentals with soft-delete support.");
        process.exit();
    } catch (err) {
        console.error("Seeding Error:", err.message);
        process.exit(1);
    }
};

seed();