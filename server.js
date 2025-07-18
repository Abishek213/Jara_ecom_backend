// import express from 'express';
// import dotenv from 'dotenv';
// import connectDB from './config/db.js';
// import authRoutes from './routes/authRoutes.js';
// import cors from 'cors';
// import paymentRoutes from './routes/paymentRoutes.js';
// import bodyParser from 'body-parser';


// dotenv.config();
// const app = express();
// app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));


// // Middleware
// app.use(express.json()); // for parsing JSON bodies
// app.use(cors());

// app.use('/api/auth', authRoutes);
// app.use('/api/payment', paymentRoutes);

// // Test route
// app.get('/', (req, res) => {
//   res.send('API is running...');
// });

// // Connect DB and start server
// const PORT = process.env.PORT || 5000;

// connectDB().then(() => {
//   app.listen(PORT, () => {
//     console.log(`🚀 Server running at http://localhost:${PORT}`);
//   });
// });

import dotenv from 'dotenv';
dotenv.config(); // Must be first

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import { apiLimiter, authLimiter } from './config/rateLimiter.js';
import { NODE_ENV } from './config/constants.js';
import { notFound, errorHandler } from './middlewares/error.middleware.js';
import logger from './utils/logger.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import adminRoutes from './routes/admin.routes.js';
import promoRoutes from './routes/promo.routes.js';
import paymentRoutes from './routes/payment.routes.js';

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express
const app = express();

// Connect to database
connectDB();

// Set security headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

// Rate limiting
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Sanitize data
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(hpp());

// Dev logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/payment', paymentRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});