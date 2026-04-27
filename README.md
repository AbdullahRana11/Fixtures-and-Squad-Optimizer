# Fixtures and Squad Optimizer

**Fixtures and Squad Optimizer** is a full-stack web application designed to handle complex sports tournament scheduling and Fantasy Premier League (FPL) squad optimization. It generates realistic fixtures for various major football leagues and tournaments, predicts match outcomes, and uses dynamic programming to optimize fantasy football squads.

## Developed By
<<<<<<< HEAD
Muhammad Abdullah Rana
=======
- Muhammad Abdullah Rana
- Huzaifa Sohail
- Danyal Aqeel

## 🌟 Key Features

### 📅 Fixture Generation Engine
- **League Scheduling:** Generates fully balanced double round-robin schedules for the Premier League, La Liga, Serie A, Bundesliga, and Custom leagues utilizing the **Circle Method (Polygon Method)**.
- **Tournament Support:** 
  - **FA Cup:** Simulates knock-out rounds for 64 teams.
  - **Champions League:** Handles both the League Phase and the Knockout bracket simulation.
- **Constraints Handling:** Ensures fair scheduling, respecting geographic zones, winter restrictions, and rivalry/policing conflicts.

### 🔮 Match Predictor
- Uses advanced statistical modeling to predict the outcome of matches based on team strength (UEFA pots), home advantage, and derby rivalry modifiers.

### 💰 FPL Squad Optimizer (Knapsack Engine)
- Utilizes the **Knapsack 0/1 Algorithm (Dynamic Programming)** to calculate the most optimal Fantasy Premier League squad.
- Considers a fixed budget (e.g., 100m) to maximize player points.
- Dynamically adjusts player values based on upcoming fixture difficulty, home/away status, and opposition strength.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS & Framer Motion (for animations)
- **State Management:** Zustand
- **Icons:** Lucide React
- **Routing:** React Router DOM

### Backend
- **Framework:** Node.js with Express
- **Language:** TypeScript
- **Database:** SQLite (managed via Prisma ORM)
- **Architecture:** Controller-Service pattern for advanced algorithmic engines.

---

## 🚀 How to Run Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 1. Start the Backend Server
The backend handles API requests, fixture generation algorithms, and database queries.

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Initialize and seed the SQLite database
npx prisma db push
npx prisma db seed

# Start the development server (runs on http://127.0.0.1:3000)
npm run dev
```

### 2. Start the Frontend Application
The frontend is the user interface built with React and Vite.

```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server (runs on http://localhost:5173)
npm run dev
```

### 3. Access the App
Open your web browser and navigate to **`http://localhost:5173`**.

---

## 🧠 Algorithmic Core

The magic of this application lies in its algorithmic backend located in `backend/src/algorithms/`:
- `fixture-generator.ts`: Implements the Circle Method for league scheduling.
- `fpl-knapsack-engine.ts`: Solves the 0/1 Knapsack problem for Fantasy League budget optimization.
- `match-predictor.ts`: Probability-based match outcome simulation.
- `fa-cup-engine.ts` & `cl-knockout-engine.ts`: Bracket and single-elimination tournament generation.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.
>>>>>>> d8bad024dbe54ddf97ec4e1b201fed68dd495dfe
