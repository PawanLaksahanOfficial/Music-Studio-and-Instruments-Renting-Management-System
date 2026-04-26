const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

// Register models
require('./models/User');
require('./models/Inventory');
require('./models/Customer');
require('./models/ProductRental');

// Import the routes file
const rentalRoutes = require('./routes/rentalRoutes');
const customerRoutes = require('./routes/customerRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount the routes
app.use('/api/rentals', rentalRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes)

app.get('/', (req, res) => {
  res.send('ELVI Music Studio API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});