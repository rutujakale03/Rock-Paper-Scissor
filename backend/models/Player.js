// models/Player.js - Schema for tracking players

const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  username: {
    type: String, required: true, unique: true,
    trim: true, minlength: 1, maxlength: 30,
  },
  // Password stored as plain text (beginner-friendly)
  password: {
    type: String, required: true,
  },
  // Admin flag — set manually in DB or via seed script
  isAdmin: {
    type: Boolean, default: false,
  },
  createdAt: {
    type: Date, default: Date.now,
  },
});

module.exports = mongoose.model('Player', playerSchema);
