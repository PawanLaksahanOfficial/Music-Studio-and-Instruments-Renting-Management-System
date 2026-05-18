const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { initCronJobs } = require('./utils/cronJobs');

dotenv.config();
connectDB();

// Register all models up front to avoid OverwriteModelError
require('./models/User');
require('./models/Customer');
require('./models/Inventory');
require('./models/ProductRental');
require('./models/StudioRental');
require('./models/Invoice');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/rentals', require('./routes/rentalRoutes'));
app.use('/api/studio-rentals', require('./routes/studioRentalRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/cron', require('./routes/cronRoutes'));

app.get('/', (req, res) => res.send('🎵 ELVI Music Studio API is running...'));

app.use((err, req, res, _next) => {
    console.error('[Error]', err.stack || err.message);
    const status = typeof err.status === 'number' ? err.status : 500;
    res.status(status).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    initCronJobs();
});
