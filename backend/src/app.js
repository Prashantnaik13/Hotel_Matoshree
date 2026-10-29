import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './routes/auth.js';
import tableRoutes from './routes/tables.js';
import menuRoutes from './routes/menu.js';
import orderRoutes from './routes/orders.js';
import billingRoutes from './routes/billing.js';
import kitchenRoutes from './routes/kitchen.js';
import dashboardRoutes from './routes/dashboard.js';
import reportRoutes from './routes/reports.js';
import settingsRoutes from './routes/settings.js';
import searchRoutes from './routes/search.js';
import notificationRoutes from './routes/notifications.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet({ crossOriginEmbedderPolicy:false }));
app.use(morgan('dev'));
app.use(cors({ origin: true, credentials:true }));
app.use(express.json({ limit:'2mb' }));
app.use(express.urlencoded({ extended:true }));
app.use(cookieParser());

// rate limit login
const loginLimiter = rateLimit({ windowMs: 15*60*1000, max: 30, message:'Too many login attempts' });
app.use('/api/auth/login', loginLimiter);

// routes
app.get('/api/health', (req,res)=> res.json({ success:true, message:'Hotel POS API running', time: new Date() }));
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/users', settingsRoutes); // alias for /api/settings/users but keep

app.use(errorHandler);

// 404
app.use((req,res)=> res.status(404).json({ success:false, message:'Route not found' }));

export default app;
