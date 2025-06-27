import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import cors from 'cors';
import paymentRoutes from './routes/paymentRoutes.js';
import bodyParser from 'body-parser';


dotenv.config();
const app = express();
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));


// Middleware
app.use(express.json()); // for parsing JSON bodies
app.use(cors());

app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Connect DB and start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});
