import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import {
  Timeline,
  Expertise,
  Terminal,
  Project,
  Contact,
  Footer
} from "./components";
import FadeIn from "./components/FadeIn";
import Certificates from "./components/Certificates";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useVault } from "./hooks/useVault";
import { useInsights } from "./hooks/useInsights";
import { DefaultLayout, FullscreenLayout } from "./layouts";
import "./index.scss";

// Lazy load pages
const MainPage = lazy(() => import('./pages/MainPage'));
const VaultPage = lazy(() => import('./pages/VaultPage'));
const InsightsPage = lazy(() => import('./pages/InsightsPage'));

// Boot Sequence Component
function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);
  const [showReady, setShowReady] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  const statusMessages = [
    "Initializing portfolio...",
    "Loading interface...",
    "Preparing projects...",
    "Compiling experience...",
    "Connecting components...",
    "Rendering timeline...",
    "Loading terminal...",
    "Decrypting vault...",
    "Unlocking insights...",
    "Synchronizing animations...",
    "Finalizing experience..."
  ];

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReducedMotion) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          setShouldRender(false);
          onComplete();
        }, 400);
      }, 1000);
      return () => clearTimeout(timer);
    }

    const totalDuration = 1800;
    const statusDuration = totalDuration / statusMessages.length;
    const readyDelay = 200;

    let statusInterval: NodeJS.Timeout;
    let statusIndex = 0;

    startTimeRef.current = Date.now();

    const animateProgress = () => {
      const elapsed = Date.now() - (startTimeRef.current || 0);
      const rawProgress = Math.min(elapsed / totalDuration, 1);
      const eased = 1 - Math.pow(1 - rawProgress, 3);
      setProgress(eased * 100);

      if (rawProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(animateProgress);
      }
    };

    statusInterval = setInterval(() => {
      if (statusIndex < statusMessages.length - 1) {
        statusIndex++;
        setCurrentStatusIndex(statusIndex);
      } else {
        clearInterval(statusInterval);
        setShowReady(true);
        
        setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => {
            setShouldRender(false);
            onComplete();
          }, 600);
        }, readyDelay);
      }
    }, statusDuration);

    animateProgress();

    return () => {
      if (statusInterval) clearInterval(statusInterval);
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onComplete, prefersReducedMotion, statusMessages.length]);

  if (!shouldRender) return null;

  const currentStatus = showReady ? "Ready." : statusMessages[currentStatusIndex];
  const isReady = showReady;

  return (
    <div className={`boot-screen ${!isVisible ? 'boot-fade-out' : ''}`}>
      <div className="boot-background">
        <div className="boot-ambient-glow" />
        <div className="boot-grid-overlay" />
      </div>
      <div className="boot-particles">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i}
            className="boot-particle"
            style={{
              '--delay': `${i * 0.12}s`,
              '--x': `${10 + Math.random() * 80}%`,
              '--y': `${10 + Math.random() * 80}%`,
              '--size': `${1.5 + Math.random() * 3}px`,
              '--duration': `${4 + Math.random() * 3}s`,
              '--opacity': `${0.1 + Math.random() * 0.2}`
            } as React.CSSProperties}
          />
        ))}
      </div>
      <div className="boot-content">
        <div className="boot-status-wrapper" key={currentStatus}>
          <div className={`boot-status ${isReady ? 'boot-status-ready' : ''}`}>
            {currentStatus}
          </div>
        </div>
        <div className="boot-progress-wrapper">
          <div 
            className="boot-progress-bar"
            style={{ 
              width: `${progress}%`,
              opacity: isVisible ? 1 : 0
            }}
          />
        </div>
        <div className="boot-system-indicator">
          <span className="boot-dot" />
          <span className="boot-dot" />
          <span className="boot-dot" />
        </div>
      </div>
    </div>
  );
}

// Wrapper for pages that need the default layout with extra sections
function DefaultLayoutWithSections({ children }: { children: React.ReactNode }) {
  return (
    <DefaultLayout>
      <FadeIn transitionDuration={700}>
        {children}
        <Terminal />
        <Timeline />
        <Project />
        <Expertise />
        <Certificates />
        <Contact />
        <Footer />
      </FadeIn>
    </DefaultLayout>
  );
}

function AppContent() {
  const location = useLocation();
  const { isUnlocked: isVaultUnlocked, isLoading: vaultLoading } = useVault();
  const { isUnlocked: isInsightsUnlocked, isLoading: insightsLoading } = useInsights();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth"
    });
  }, [location.pathname]);

  // Wait for authentication to complete
  useEffect(() => {
    if (!vaultLoading && !insightsLoading) {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [vaultLoading, insightsLoading]);

  console.log('App - Current path:', location.pathname);
  console.log('App - Vault unlocked:', isVaultUnlocked);
  console.log('App - Insights unlocked:', isInsightsUnlocked);
  console.log('App - Vault loading:', vaultLoading);
  console.log('App - Insights loading:', insightsLoading);
  console.log('App - Is ready:', isReady);

  // Show loading state while authenticating
  if (!isReady) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  // Check if current route is fullscreen
  const isFullscreenRoute = location.pathname === '/vault' || location.pathname === '/insights';

  return (
    <div className={isFullscreenRoute ? '' : 'main-container dark-mode'}>
      <Routes>
        <Route 
          path="/" 
          element={
            <DefaultLayoutWithSections>
              <MainPage />
            </DefaultLayoutWithSections>
          } 
        />
        <Route 
          path="/vault" 
          element={
            <FullscreenLayout>
              <ProtectedRoute isUnlocked={isVaultUnlocked} isLoading={false}>
                <VaultPage />
              </ProtectedRoute>
            </FullscreenLayout>
          } 
        />
        <Route 
          path="/insights" 
          element={
            <FullscreenLayout>
              <ProtectedRoute isUnlocked={isInsightsUnlocked} isLoading={false}>
                <InsightsPage />
              </ProtectedRoute>
            </FullscreenLayout>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  const [showBoot, setShowBoot] = useState(true);

  const handleBootComplete = () => {
    setShowBoot(false);
  };

  return (
    <Suspense fallback={
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    }>
      {showBoot ? (
        <BootSequence onComplete={handleBootComplete} />
      ) : (
        <AppContent />
      )}
    </Suspense>
  );
}

export default App;