import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import { PageTransition } from './components/PageTransition';
import { LoadingScreen } from './components/LoadingScreen';

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



const AppContent: React.FC = () => {

  return (
    <RootLayout>
      <main className="flex-1 flex flex-col min-h-screen">
        <Suspense fallback={<LoadingScreen />}>
          <PageTransition>
            <Routes>
              {/* --- Editorial Section (Fixture Generator) --- */}
              <Route element={<div className="font-merriweather flex-1 flex flex-col"><Outlet /></div>}>
                <Route path="/" element={<Home />} />
                <Route path="/fixtures" element={<CompetitionSelector />} />
                <Route path="/fixtures/select" element={<TeamSelector />} />
                <Route path="/fixtures/display" element={<FixtureDisplay />} />
                <Route path="/fixtures/bracket" element={<FACupBracket />} />
                <Route path="/fixtures/ucl-bracket" element={<UCLBracket />} />
                <Route path="/fixtures/generate" element={<UCLDraw />} />
                <Route path="/fixtures/custom" element={<CustomGenerator />} />
              </Route>

              {/* --- HUD Section (Squad Optimizer) --- */}
              <Route path="/fpl" element={<div className="font-outfit flex-1 flex flex-col"><FPLWrapper /></div>} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageTransition>
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



