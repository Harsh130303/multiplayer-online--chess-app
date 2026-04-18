# ♟️ Multiplayer Real-Time Chess Platform

A modern, full-stack multiplayer chess application built with **FastAPI** and **React**. This platform supports real-time gameplay via WebSockets, persistent game states, and a custom-built chess engine.

---

## 🚀 Features

- **Real-Time Multiplayer**: Instant move synchronization using WebSockets.
- **Custom Chess Engine**: Handles move validation, castling, en passant, and game-over detection (checkmate/stalemate).
- **Game Rooms**: Create private rooms with unique IDs and custom time controls.
- **Dynamic Chess Clock**: Integrated timers for each player with automatic timeout detection.
- **Authentication**: Secure JWT-based user registration and login.
- **Responsive Design**: Modern, glassmorphic UI optimized for both desktop and tablet.
- **Scalable Architecture**: Dockerized and ready for cloud deployment (configured for Railway/Render).

---

## 🛠️ Tech Stack

### **Backend**
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database**: PostgreSQL (Production) / SQLite (Local)
- **ORM**: SQLAlchemy
- **Real-Time**: WebSockets
- **Auth**: JWT (Jose) & Passlib (BCrypt)

### **Frontend**
- **Framework**: [React](https://reactjs.org/) (Vite)
- **API Client**: Axios
- **Routing**: React Router DOM
- **State Management**: React Context API

---

## 📦 Project Structure

```bash
├── app/                  # FastAPI Backend logic
│   ├── auth.py           # JWT and Security
│   ├── chess_engine.py   # Core Chess logic & rules
│   ├── models.py         # Database models
│   ├── routes.py         # API & WebSocket endpoints
│   └── schemas.py        # Pydantic validation models
├── frontend/             # React Frontend
│   ├── src/
│   │   ├── components/   # ChessBoard, Timer
│   │   ├── pages/        # Home, Game, Login, Register
│   │   └── context/      # Auth state management
├── main.py               # Application entry point
├── Dockerfile            # Container configuration
└── requirements.txt      # Python dependencies
```

---

## 🛠️ Local Setup

### **1. Backend Setup**
1. Clone the repository: `git clone <repo-url>`
2. Create a virtual environment: `python -m venv venv`
3. Activate venv: `source venv/bin/activate` (or `venv\Scripts\activate` on Windows)
4. Install dependencies: `pip install -r requirements.txt`
5. Run the server: `python main.py`

### **2. Frontend Setup**
1. Navigate to frontend: `cd frontend`
2. Install packages: `npm install`
3. Run development server: `npm run dev`

---

## 🐳 Deployment (Docker)

The project is dockerized for easy deployment. It uses a multi-stage build to serve the React frontend through the FastAPI application.

```bash
# Build and run with Docker
docker build -t chess-app .
docker run -p 8080:8080 chess-app
```

---

## 📜 License
This project is licensed under the MIT License.
