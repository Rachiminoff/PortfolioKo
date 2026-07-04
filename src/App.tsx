import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
  const { isUnlocked: isVaultUnlocked } = useVault();
  const { isUnlocked: isInsightsUnlocked } = useInsights();

  React.useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth"
    });
  }, []);

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
        
        {/* These sections appear on all pages except when on /vault or /insights */}
        <Routes>
          <Route path="/" element={
            <>
              <Terminal />
              <Timeline />
              <Project />
              <Expertise />
              <Certificates />
              <Contact />
              <Footer />
            </>
          } />
          <Route path="/vault" element={null} />
          <Route path="/insights" element={null} />
        </Routes>
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