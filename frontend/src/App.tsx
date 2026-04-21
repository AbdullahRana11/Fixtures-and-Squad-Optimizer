import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import Navbar from './components/Navbar';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const UCLDraw = lazy(() => import('./pages/UCLDraw'));
const FPLOptimizer = lazy(() => import('./pages/FPLOptimizer'));

const LoadingScreen = () => (
  <div className="flex-1 flex items-center justify-center font-space text-mint-sentinel uppercase tracking-[0.3em] animate-pulse">
    Algorithm Loading...
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <RootLayout>
        <Navbar />
        <main className="flex-1 flex flex-col">
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/ucl-draw" element={<UCLDraw />} />
              <Route path="/fpl-optimizer" element={<FPLOptimizer />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </RootLayout>
    </Router>
  );
};

export default App;
