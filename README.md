# ✊ Rock Paper Scissors — Full Stack Game

A full-stack Rock Paper Scissors game built with **HTML/CSS/JS**, **Node.js + Express**, and **MongoDB**.

---

## 📁 Project Structure

```
/
├── frontend/
│   ├── index.html      # Game UI
│   ├── style.css       # Styles & animations
│   └── script.js       # Fetch API calls to backend
│
└── backend/
    ├── server.js           # Express app entry point
    ├── db.js               # MongoDB connection
    ├── package.json        # Dependencies
    ├── models/
    │   └── Game.js         # Mongoose schema
    └── routes/
        └── game.js         # API route handlers
```

---

## 🚀 How to Run

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) running locally on port 27017
  - OR a free [MongoDB Atlas](https://www.mongodb.com/atlas) cloud URI

---

### Step 1 — Install dependencies

```bash
cd backend
npm install
```

---

### Step 2 — (Optional) Set MongoDB URI

By default the app connects to `mongodb://localhost:27017/rps_game`.

To use MongoDB Atlas, set the environment variable before starting:

```bash
# Windows CMD
set MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/rps_game

# Windows PowerShell
$env:MONGO_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net/rps_game"

# macOS / Linux
export MONGO_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net/rps_game"
```

---

### Step 3 — Start the server

```bash
# From the backend folder
npm start

# Or with auto-reload during development
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running at http://localhost:3000
```

---

### Step 4 — Open the game

Open your browser and go to:

```
http://localhost:3000
```

The Express server automatically serves the `frontend/` folder as static files.

---

## 🔌 API Endpoints

| Method | Endpoint      | Description                          |
|--------|---------------|--------------------------------------|
| POST   | `/api/play`   | Play a round. Body: `{ userChoice }` |
| GET    | `/api/score`  | Get current win/lose/draw counts     |
| DELETE | `/api/reset`  | Clear all game records               |

---

## 🎮 Features

- Rock, Paper, Scissors buttons with hover animations
- Live scoreboard (You vs Computer vs Draws)
- Result display with win/lose/draw styling
- Last 5 match history loaded from MongoDB
- Reset score button
- Error handling with toast notifications
- Fully responsive design
