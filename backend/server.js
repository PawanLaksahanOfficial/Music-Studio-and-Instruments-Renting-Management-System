const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Models
const User = require('./models/User');
const Inventory = require('./models/Inventory');
const ProductRental = require('./models/ProductRental');

app.get('/', (req, res) => {
  res.send('ELVI Music Studio API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});