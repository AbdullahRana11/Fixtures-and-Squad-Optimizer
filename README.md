---
title: Fixtures and Squad Optimizer
emoji: ⚽
colorFrom: green
colorTo: blue
sdk: docker
pinned: false
license: mit
app_port: 7860
---

# ⚽ Fixtures & Squad Optimizer

A full-stack tactical command center for generating football and cricket fixtures, optimizing squads using a knapsack algorithm, and running match intelligence simulations.

## Features

- 🗓️ **Fixture Generator** — Round-robin, FA Cup, UCL Swiss model for 15+ leagues
- 🧠 **Match Intelligence** — AI-powered match prediction with form/rivalry data
- 🏆 **Squad Optimizer** — FPL knapsack engine for optimal 15-player squads
- 📺 **TV Schedule View** — Broadcaster-aware fixture scheduling
- 🏟️ **3D Bracket View** — Visual knockout bracket renderer
- 🏏 **Cricket Mode** — PSL, IPL, BBL, CPL, SA20, ICC tournaments

## Tech Stack

- **Frontend**: Vite + React 18 + Framer Motion + Three.js + Zustand
- **Backend**: Node.js + Express + Prisma ORM
- **Database**: PostgreSQL (Neon)
- **Algorithms**: Knapsack optimization, Swiss model engine, Match predictor
