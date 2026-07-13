// script.js — Rock Paper Scissors game
// Session is managed via localStorage (rps_session).
// If no session found on load, redirects to login.html.

// ─────────────────────────────────────────────
// Star-field background (canvas animation)
// ─────────────────────────────────────────────
(function initStars() {
  const canvas = document.getElementById('stars-canvas');
  const ctx    = canvas.getContext('2d');
  const COLORS = ['#ff5c7a', '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b'];
  const stars  = [];

  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.4 + 0.3,
      speed: Math.random() * 0.3 + 0.06,
      opacity: Math.random() * 0.5 + 0.15,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      twinkle: Math.random() * Math.PI * 2,
    });
  }

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach((s) => {
      s.twinkle += 0.018;
      ctx.globalAlpha = s.opacity * (0.55 + 0.45 * Math.sin(s.twinkle));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.globalAlpha = 1;
      s.y -= s.speed;
      if (s.y < -4) { s.y = canvas.height + 4; s.x = Math.random() * canvas.width; }
    });
    requestAnimationFrame(draw);
  };
  draw();
})();

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
const API_BASE = 'http://localhost:5500/api';
const EMOJI    = { rock: '✊', paper: '✋', scissors: '✌️' };

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────
let currentUser = null;

// ─────────────────────────────────────────────
// DOM refs
// ─────────────────────────────────────────────
const appLayout          = document.getElementById('app-layout');
const badgeName          = document.getElementById('badge-name');
const badgeAvatar        = document.getElementById('badge-avatar');
const scoreLabelYou      = document.getElementById('score-label-you');
const logoutBtn          = document.getElementById('logout-btn');
const choiceButtons      = document.querySelectorAll('.choice-btn');
const userChoiceDisplay  = document.getElementById('user-choice-display');
const compChoiceDisplay  = document.getElementById('computer-choice-display');
const resultMessage      = document.getElementById('result-message');
const userScoreEl        = document.getElementById('user-score');
const computerScoreEl    = document.getElementById('computer-score');
const drawScoreEl        = document.getElementById('draw-score');
const historyList        = document.getElementById('history-list');
const resetBtn           = document.getElementById('reset-btn');
const toast              = document.getElementById('toast');
const playersList        = document.getElementById('players-list');
const refreshPlayersBtn  = document.getElementById('refresh-players');

// ─────────────────────────────────────────────
// Toast helper
// ─────────────────────────────────────────────
const showToast = (msg, isError = false) => {
  toast.textContent = msg;
  toast.className   = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => { toast.className = 'toast'; }, 3000);
};

// ─────────────────────────────────────────────
// Pop animation helper
// ─────────────────────────────────────────────
const animatePop = (el) => {
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
};

// ─────────────────────────────────────────────
// SESSION — start game for logged-in user
// ─────────────────────────────────────────────
const startSession = (username) => {
  currentUser = username;
  badgeName.textContent     = username;
  badgeAvatar.textContent   = username.charAt(0).toUpperCase();
  scoreLabelYou.textContent = username.length > 8 ? username.slice(0, 8) + '…' : username;
  appLayout.style.display   = 'flex';
  updateScore();
  loadPlayers();
};

// Logout — clear session and go to login page
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('rps_session');
  window.location.href = 'login.html';
});

// ─────────────────────────────────────────────
// SCORE
// ─────────────────────────────────────────────
const updateScore = async () => {
  if (!currentUser) return;
  try {
    const res  = await fetch(`${API_BASE}/score?username=${encodeURIComponent(currentUser)}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    userScoreEl.textContent     = data.userWins;
    computerScoreEl.textContent = data.computerWins;
    drawScoreEl.textContent     = data.draws;
  } catch (err) {
    console.error('Score error:', err);
  }
};

// ─────────────────────────────────────────────
// HISTORY
// ─────────────────────────────────────────────
const renderHistory = (history) => {
  historyList.innerHTML = '';
  if (!history || history.length === 0) {
    historyList.innerHTML = '<li class="history-empty">No games played yet.</li>';
    return;
  }
  history.forEach((game) => {
    const li   = document.createElement('li');
    li.className = 'history-item';
    const time = new Date(game.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    li.innerHTML = `
      <span class="choices-text">
        ${time} &nbsp;|&nbsp;
        You: <span>${EMOJI[game.userChoice]} ${game.userChoice}</span>
        &nbsp;vs&nbsp;
        CPU: <span>${EMOJI[game.computerChoice]} ${game.computerChoice}</span>
      </span>
      <span class="history-badge ${game.result}">
        ${game.result === 'win' ? '🏆 Win' : game.result === 'lose' ? '💀 Lose' : '🤝 Draw'}
      </span>`;
    historyList.appendChild(li);
  });
};

// ─────────────────────────────────────────────
// PLAY
// ─────────────────────────────────────────────
const playRound = async (userChoice) => {
  if (!currentUser) return;
  choiceButtons.forEach((b) => (b.disabled = true));
  userChoiceDisplay.textContent = '⏳';
  compChoiceDisplay.textContent = '⏳';
  resultMessage.className       = 'result-message';
  resultMessage.textContent     = 'Thinking…';

  try {
    const res = await fetch(`${API_BASE}/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser, userChoice }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Server error'); }
    const data = await res.json();

    userChoiceDisplay.textContent = EMOJI[data.userChoice];
    compChoiceDisplay.textContent = EMOJI[data.computerChoice];
    animatePop(userChoiceDisplay);
    animatePop(compChoiceDisplay);

    const msgs = { win: '🏆 You Win!', lose: '💀 You Lose!', draw: "🤝 It's a Draw!" };
    resultMessage.textContent = msgs[data.result];
    resultMessage.className   = `result-message ${data.result}`;

    await updateScore();
    renderHistory(data.history);
    loadPlayers();
  } catch (err) {
    console.error('Play error:', err);
    showToast(err.message.includes('fetch') ? '❌ Cannot reach server. Is the backend running?' : err.message, true);
    userChoiceDisplay.textContent = '❓';
    compChoiceDisplay.textContent = '❓';
    resultMessage.textContent     = 'Something went wrong. Try again!';
    resultMessage.className       = 'result-message';
  } finally {
    choiceButtons.forEach((b) => (b.disabled = false));
  }
};

choiceButtons.forEach((btn) => {
  btn.addEventListener('click', () => playRound(btn.dataset.choice));
});

// ─────────────────────────────────────────────
// RESET
// ─────────────────────────────────────────────
resetBtn.addEventListener('click', async () => {
  if (!confirm('Reset your score and history?')) return;
  try {
    const res = await fetch(`${API_BASE}/reset`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser }),
    });
    if (!res.ok) throw new Error('Reset failed');
    userScoreEl.textContent       = '0';
    computerScoreEl.textContent   = '0';
    drawScoreEl.textContent       = '0';
    userChoiceDisplay.textContent = '❓';
    compChoiceDisplay.textContent = '❓';
    resultMessage.textContent     = 'Pick a choice to start playing!';
    resultMessage.className       = 'result-message';
    historyList.innerHTML         = '<li class="history-empty">No games played yet.</li>';
    showToast('Score reset! 🔄');
    loadPlayers();
  } catch { showToast('Could not reset score.', true); }
});

// ─────────────────────────────────────────────
// LEADERBOARD
// ─────────────────────────────────────────────
const escapeHtml = (str) =>
  str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const loadPlayers = async () => {
  try {
    const res = await fetch(`${API_BASE}/players`);
    if (!res.ok) throw new Error();
    const players = await res.json();
    playersList.innerHTML = '';
    if (players.length === 0) { playersList.innerHTML = '<li class="players-empty">No players yet.</li>'; return; }
    players.forEach((p, i) => {
      const li        = document.createElement('li');
      const rank      = i + 1;
      const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-n';
      const isMe      = p.username === currentUser ? 'is-me' : '';
      li.className    = `player-row ${isMe}`;
      li.innerHTML    = `
        <div class="player-rank ${rankClass}">${rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}</div>
        <div class="player-info">
          <div class="player-name">${escapeHtml(p.username)}${isMe ? ' (you)' : ''}</div>
          <div class="player-stats">${p.total} game${p.total !== 1 ? 's' : ''} played</div>
        </div>
        <div class="player-wins">${p.wins} W</div>`;
      playersList.appendChild(li);
    });
  } catch { playersList.innerHTML = '<li class="players-empty">Could not load players.</li>'; }
};

refreshPlayersBtn.addEventListener('click', loadPlayers);

// ─────────────────────────────────────────────
// INIT — check session from localStorage
// ─────────────────────────────────────────────
const session = JSON.parse(localStorage.getItem('rps_session') || 'null');
if (!session || !session.username) {
  // Not logged in — send to homepage
  window.location.href = 'home.html';
} else {
  // Session found — start the game
  startSession(session.username);
}
