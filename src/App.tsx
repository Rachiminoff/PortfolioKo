import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import {
  Timeline,
  Expertise,
  Terminal,
  Project,
  Navigation,
  Contact,
  Footer
} from "./components";
import FadeIn from "./components/FadeIn";
import Certificates from "./components/Certificates";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useVault } from "./hooks/useVault";
import { useInsights } from "./hooks/useInsights";
import "./index.scss";

// Lazy load pages
const MainPage = lazy(() => import('./pages/MainPage'));
const VaultPage = lazy(() => import('./pages/VaultPage'));
const InsightsPage = lazy(() => import('./pages/InsightsPage'));

function AppContent() {
  const location = useLocation();
  const { isUnlocked: isVaultUnlocked } = useVault();
  const { isUnlocked: isInsightsUnlocked } = useInsights();

  React.useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth"
    });
  }, []);

  // Check if we're on vault or insights page
  const isSpecialPage = location.pathname === '/vault' || location.pathname === '/insights';

  return (
    <div className="main-container dark-mode">
      <Navigation />
      
      <FadeIn transitionDuration={700}>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route 
            path="/vault" 
            element={
              <ProtectedRoute isUnlocked={isVaultUnlocked}>
                <VaultPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/insights" 
            element={
              <ProtectedRoute isUnlocked={isInsightsUnlocked}>
                <InsightsPage />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Only show these sections on the home page */}
        {!isSpecialPage && (
          <>
            <Terminal />
            <Timeline />
            <Project />
            <Expertise />
            <Certificates />
            <Contact />
            <Footer />
          </>
        )}
      </FadeIn>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    }>
      <AppContent />
    </Suspense>
  );
}

export default App;