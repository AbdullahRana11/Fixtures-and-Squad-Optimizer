# ⚡ PSL FANTASY // Tactical Command Center

> **Fixtures and Squad Optimizer** is a high-fidelity, tactical HUD suite for professional sports tournament scheduling and Fantasy Premier League (FPL) optimization.

[![Project Status](https://img.shields.io/badge/Status-Operational-emerald?style=for-the-badge&logo=statuspage)](https://github.com/DANYALAQEEL/FAS-DAA)
[![Tech Stack](https://img.shields.io/badge/Stack-React_|_Node.js_|_Three.js-cyan?style=for-the-badge&logo=react)](https://github.com/DANYALAQEEL/FAS-DAA)

---

## 🛰️ Project Overview

This platform has been modernized into a **Level 100 Tactical Command Center**. It moves beyond standard spreadsheets to provide a high-density, telemetry-driven environment for generating realistic fixtures, predicting match outcomes, and solving the "Knapsack" problem for FPL budget optimization.

### 🔳 The "Tactical HUD" Experience
The UI has been completely overhauled with a futuristic, military-grade aesthetic:
- **Hyperspeed WebGL**: Dynamic, interactive light-trail backgrounds that respond to user engagement.
- **Glassmorphic Navigation**: Ultra-transparent, high-blur interface elements (`backdrop-blur-3xl`).
- **Telemetry HUD**: Real-time system load and data-grid status indicators for a professional feel.
- **Magnetic Interaction**: Physics-based hover states and "decrypted" text animations for enhanced user engagement.

---

## 🧠 Algorithmic Core

The power of this suite lies in its advanced backend engines, located in `backend/src/algorithms/`:

### 📅 Fixture Generation Engine
- **League Scheduling**: Implements the **Circle Method (Polygon Method)** for balanced double round-robin schedules.
- **Tournament Simulation**:
  - **FA Cup**: Full 64-team knockout bracket simulation.
  - **Champions League**: League phase and knockout bracket generation.
- **Constraint Solver**: Manages geographic restrictions, rivalry conflicts, and scheduling fairness.

### 💰 FPL Squad Optimizer (Knapsack Engine)
- **Mathematical Optimization**: Uses the **0/1 Knapsack Algorithm (Dynamic Programming)** to maximize squad points within a 100m budget.
- **Dynamic Valuation**: Real-time adjustment of player value based on fixture difficulty, opposition strength, and historic performance.

### 🔮 Match Predictor
- Statistical outcome modeling based on UEFA pot strength, home/away advantage, and rivalry modifiers.

---

## 🛠️ Tech Stack

### Frontend (Tactical HUD)
- **Core**: React 18, Vite, TypeScript
- **Visuals**: Three.js (WebGL), Framer Motion, GSAP
- **Components**: React Bits (Hyperspeed, GridScan, Magnet, TiltedCard)
- **State**: Zustand

### Backend (Algorithmic API)
- **Core**: Node.js, Express, TypeScript
- **Database**: SQLite with Prisma ORM
- **Logic**: Custom Algorithmic Service Layer

---

## 🚀 Installation & Tactical Deployment

### 1. Initialize Backend
```bash
cd backend
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

### 2. Launch Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 👥 Development Team
- **Muhammad Abdullah Rana**
- **Huzaifa Sohail**
- **Danyal Aqeel**

---

## 🤝 License & Contributions
This project is for educational and tactical research purposes. Contributions are welcome via Pull Request.

---
**OPERATIONAL STATUS: READY FOR DEPLOYMENT**
