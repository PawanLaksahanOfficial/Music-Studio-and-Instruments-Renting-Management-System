const cron = require('node-cron');
const ProductRental = require('../models/ProductRental');
const { sendSMS, sendEmail } = require('./aws');

/**
 * Logic to run due date reminders
 * Extracted so it can be called by cron or manually via API
 */
exports.runDueDateReminders = async () => {
    console.log('Running due date reminders...');
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find rentals due yesterday, today, or tomorrow
        const rentals = await ProductRental.find({
            status: 'Rented',
            dueDate: {
                $gte: yesterday,
                $lte: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
            }
        }).populate('customer');

        let processedCount = 0;

        for (const rental of rentals) {
            const customer = rental.customer;
            if (!customer) continue;

            const dueDate = new Date(rental.dueDate);
            dueDate.setHours(0, 0, 0, 0);

            let message = '';
            if (dueDate.getTime() === tomorrow.getTime()) {
                message = `Reminder: Your rental ${rental.rentalId} is due tomorrow (${dueDate.toLocaleDateString()}). Please return it to ELVI Studio.`;
            } else if (dueDate.getTime() === today.getTime()) {
                message = `Reminder: Your rental ${rental.rentalId} is due TODAY. Please return it to ELVI Studio.`;
            } else if (dueDate.getTime() === yesterday.getTime()) {
                message = `URGENT: Your rental ${rental.rentalId} was due yesterday (${dueDate.toLocaleDateString()}). Please return it immediately to avoid extra charges.`;
            }

            if (message) {
                processedCount++;
                // Send SMS if phone exists
                if (customer.phone) {
                    try { await sendSMS(customer.phone, message); } catch (e) { console.error('SMS Failed', e); }
                }
                // Send Email if email exists
                if (customer.email) {
                    try { await sendEmail(customer.email, 'Rental Due Date Reminder - ELVI Studio', message); } catch (e) { console.error('Email Failed', e); }
                }
            }
        }
        console.log(`Due date reminders completed. Processed ${processedCount} rentals.`);
        return processedCount;
    } catch (err) {
        console.error('Reminder Job Error:', err);
        throw err;
    }
};

// Schedule reminders every day at 9:00 AM
exports.initCronJobs = () => {
    cron.schedule('0 9 * * *', async () => {
        await exports.runDueDateReminders();
    });
    
    console.log('Cron jobs initialized.');
};
