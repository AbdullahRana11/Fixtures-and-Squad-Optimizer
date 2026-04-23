import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const CompetitionSelector = lazy(() => import('./pages/CompetitionSelector'));
const TeamSelector = lazy(() => import('./pages/TeamSelector'));
const FixtureDisplay = lazy(() => import('./pages/FixtureDisplay'));
const FACupBracket = lazy(() => import('./pages/FACupBracket'));
const UCLDraw = lazy(() => import('./pages/UCLDraw'));
const UCLBracket = lazy(() => import('./pages/UCLBracketPage'));
const FPLWrapper = lazy(() => import('./pages/FPLWrapper'));
const CustomGenerator = lazy(() => import('./pages/CustomGenerator'));

const LoadingScreen = () => (
  <div className="flex-1 flex items-center justify-center font-space text-emerald-400 uppercase tracking-[0.3em] animate-pulse">
    System Loading...
  </div>
);

const AppContent: React.FC = () => {
  const location = useLocation();
  const isFullscreen = ['/', '/fixtures'].includes(location.pathname);

  return (
    <RootLayout>
      <main className={`flex-1 flex flex-col ${isFullscreen ? 'h-screen p-0 m-0' : ''}`}>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/fixtures" element={<CompetitionSelector />} />
            <Route path="/fixtures/select" element={<TeamSelector />} />
            <Route path="/fixtures/display" element={<FixtureDisplay />} />
            <Route path="/fixtures/bracket" element={<FACupBracket />} />
            <Route path="/fixtures/ucl-bracket" element={<UCLBracket />} />
            <Route path="/fixtures/generate" element={<UCLDraw />} />
            <Route path="/fixtures/custom" element={<CustomGenerator />} />
            <Route path="/fpl" element={<FPLWrapper />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </RootLayout>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
