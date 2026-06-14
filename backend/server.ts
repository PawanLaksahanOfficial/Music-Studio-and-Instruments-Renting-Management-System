import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import { initCronJobs } from './utils/cronJobs';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

// Models 
import './models/User';
import './models/Customer';
import './models/Inventory';
import './models/ProductRental';
import './models/StudioRental';
import './models/Invoice';

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes 
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import customerRoutes from './routes/customerRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import rentalRoutes from './routes/rentalRoutes';
import studioRentalRoutes from './routes/studioRentalRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import statsRoutes from './routes/statsRoutes';
import cronRoutes from './routes/cronRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/studio-rentals', studioRentalRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/cron', cronRoutes);

app.get('/', (req: Request, res: Response) => res.send('🎵 ELVI Music Studio API is running with TypeScript...'));

app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = typeof err.statusCode === 'number' ? err.statusCode : (typeof err.status === 'number' ? err.status : 500);
    res.status(status).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    initCronJobs();
});
