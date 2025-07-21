import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MongoDB URI not found in environment variables');
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to DB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`Mongoose connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected');
    });

  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;