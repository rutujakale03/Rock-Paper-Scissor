// db.js - MongoDB connection setup using Mongoose

const mongoose = require('mongoose');

// MongoDB connection URI - change this to your MongoDB Atlas URI if using cloud
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rps_game';

/**
 * Connect to MongoDB
 * Uses mongoose to establish a connection to the database
 */
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1); // Exit process if DB connection fails
  }
};

module.exports = connectDB;
