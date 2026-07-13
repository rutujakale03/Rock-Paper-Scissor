// models/Game.js - Schema for storing each game round

const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  // Which player played this round (stored as username string)
  username: {
    type: String,
    required: true,
    trim: true,
  },
  userChoice: {
    type: String,
    required: true,
    enum: ['rock', 'paper', 'scissors'],
  },
  computerChoice: {
    type: String,
    required: true,
    enum: ['rock', 'paper', 'scissors'],
  },
  result: {
    type: String,
    required: true,
    enum: ['win', 'lose', 'draw'],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Game', gameSchema);
