// server.js - Express entry point

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const connectDB  = require('./db');
const gameRoutes = require('./routes/game');

const app  = express();
const PORT = process.env.PORT || 5500;

// Connect to MongoDB
connectDB();

// ── Middleware ────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve the frontend folder as static files
// This handles: home.html, login.html, register.html, index.html, admin.html, style.css, script.js
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes ────────────────────────────────
app.use('/api', gameRoutes);

// ── Root: serve home.html (the landing page) ──
// When user visits http://localhost:5500 they see the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/home.html'));
});

// ── Catch-all: also serve home.html for unknown routes ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/home.html'));
});

// ── Start ─────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`   Homepage  → http://localhost:${PORT}/`);
  console.log(`   Login     → http://localhost:${PORT}/login.html`);
  console.log(`   Register  → http://localhost:${PORT}/register.html`);
  console.log(`   Game      → http://localhost:${PORT}/index.html`);
  console.log(`   Admin     → http://localhost:${PORT}/admin.html`);
});
