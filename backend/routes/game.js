// routes/game.js - All API routes for the RPS game

const express = require('express');
const router  = express.Router();
const Game    = require('../models/Game');
const Player  = require('../models/Player');

const VALID_CHOICES = ['rock', 'paper', 'scissors'];

const getComputerChoice = () => VALID_CHOICES[Math.floor(Math.random() * VALID_CHOICES.length)];

const getResult = (userChoice, computerChoice) => {
  if (userChoice === computerChoice) return 'draw';
  const wins = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
  return wins[userChoice] === computerChoice ? 'win' : 'lose';
};

// ─────────────────────────────────────────────
// POST /api/register
// Body: { username, password }
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const username = (req.body.username || '').trim();
    const password = (req.body.password || '');

    if (!username)           return res.status(400).json({ error: 'Username cannot be empty.' });
    if (username.length > 30) return res.status(400).json({ error: 'Username too long (max 30 chars).' });
    if (!password)           return res.status(400).json({ error: 'Password cannot be empty.' });
    if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters.' });

    const existing = await Player.findOne({ username });
    if (existing) return res.status(409).json({ error: 'Username already taken.' });

    const player = await Player.create({ username, password });
    res.status(201).json({
      message: 'Account created successfully.',
      player: { username: player.username, isAdmin: player.isAdmin, createdAt: player.createdAt },
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/login
// Body: { username, password }
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const username = (req.body.username || '').trim();
    const password = (req.body.password || '');

    const player = await Player.findOne({ username });
    if (!player || player.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    res.json({
      message: 'Login successful',
      player: { username: player.username, isAdmin: player.isAdmin },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/play
// Body: { username, userChoice }
// ─────────────────────────────────────────────
router.post('/play', async (req, res) => {
  try {
    const { userChoice, username } = req.body;
    if (!username || !username.trim()) return res.status(400).json({ error: 'Username is required.' });
    if (!userChoice || !VALID_CHOICES.includes(userChoice.toLowerCase()))
      return res.status(400).json({ error: 'Invalid choice. Choose rock, paper, or scissors.' });

    const normalizedChoice = userChoice.toLowerCase();
    const computerChoice   = getComputerChoice();
    const result           = getResult(normalizedChoice, computerChoice);

    await Game.create({ username: username.trim(), userChoice: normalizedChoice, computerChoice, result });

    const history = await Game.find({ username: username.trim() }).sort({ timestamp: -1 }).limit(5).lean();
    res.json({ userChoice: normalizedChoice, computerChoice, result, history });
  } catch (err) {
    console.error('Play error:', err.message);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ─────────────────────────────────────────────
// GET /api/score?username=xxx
// ─────────────────────────────────────────────
router.get('/score', async (req, res) => {
  try {
    const filter = req.query.username ? { username: req.query.username.trim() } : {};
    const [userWins, computerWins, draws] = await Promise.all([
      Game.countDocuments({ ...filter, result: 'win' }),
      Game.countDocuments({ ...filter, result: 'lose' }),
      Game.countDocuments({ ...filter, result: 'draw' }),
    ]);
    res.json({ userWins, computerWins, draws, total: userWins + computerWins + draws });
  } catch (err) {
    console.error('Score error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────
// GET /api/players  — leaderboard
// ─────────────────────────────────────────────
router.get('/players', async (req, res) => {
  try {
    const players = await Player.find().sort({ createdAt: 1 }).lean();
    const withStats = await Promise.all(players.map(async (p) => {
      const [wins, total] = await Promise.all([
        Game.countDocuments({ username: p.username, result: 'win' }),
        Game.countDocuments({ username: p.username }),
      ]);
      return { username: p.username, wins, total, createdAt: p.createdAt };
    }));
    withStats.sort((a, b) => b.wins - a.wins);
    res.json(withStats);
  } catch (err) {
    console.error('Players error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/reset  — reset player's games
// Body: { username }
// ─────────────────────────────────────────────
router.delete('/reset', async (req, res) => {
  try {
    const filter = req.body.username ? { username: req.body.username.trim() } : {};
    await Game.deleteMany(filter);
    res.json({ message: 'Score reset successfully.' });
  } catch (err) {
    console.error('Reset error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────
// GET /api/admin/stats
// ─────────────────────────────────────────────
router.get('/admin/stats', async (req, res) => {
  try {
    const [totalPlayers, totalGames, totalWins, totalLosses, totalDraws] = await Promise.all([
      Player.countDocuments(),
      Game.countDocuments(),
      Game.countDocuments({ result: 'win' }),
      Game.countDocuments({ result: 'lose' }),
      Game.countDocuments({ result: 'draw' }),
    ]);
    res.json({ totalPlayers, totalGames, totalWins, totalLosses, totalDraws });
  } catch (err) {
    console.error('Admin stats error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────
// GET /api/admin/players
// ─────────────────────────────────────────────
router.get('/admin/players', async (req, res) => {
  try {
    const players = await Player.find().lean();
    const withStats = await Promise.all(players.map(async (p) => {
      const [wins, losses, draws] = await Promise.all([
        Game.countDocuments({ username: p.username, result: 'win' }),
        Game.countDocuments({ username: p.username, result: 'lose' }),
        Game.countDocuments({ username: p.username, result: 'draw' }),
      ]);
      return { username: p.username, isAdmin: p.isAdmin, createdAt: p.createdAt, wins, losses, draws, total: wins + losses + draws };
    }));
    withStats.sort((a, b) => b.total - a.total);
    res.json(withStats);
  } catch (err) {
    console.error('Admin players error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/admin/player/:username
// ─────────────────────────────────────────────
router.delete('/admin/player/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const deleted = await Player.findOneAndDelete({ username });
    if (!deleted) return res.status(404).json({ error: 'Player not found.' });
    await Game.deleteMany({ username });
    res.json({ message: 'Player deleted.' });
  } catch (err) {
    console.error('Admin delete error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
