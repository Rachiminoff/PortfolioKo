import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
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

// Boot Sequence Component - Premium system initialization
function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);
  const [showReady, setShowReady] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  // Status messages that cycle during boot
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

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReducedMotion) {
      // Simple fade for reduced motion
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          setShouldRender(false);
          onComplete();
        }, 400);
      }, 1000);
      return () => clearTimeout(timer);
    }

    // Normal boot sequence: 1.5-2 seconds
    const totalDuration = 1800; // 1.8 seconds
    const statusDuration = totalDuration / statusMessages.length;
    const readyDelay = 200; // Pause on "Ready."

    let statusInterval: NodeJS.Timeout;
    let statusIndex = 0;

    // Start the boot sequence
    startTimeRef.current = Date.now();

    // Animate progress bar smoothly
    const animateProgress = () => {
      const elapsed = Date.now() - (startTimeRef.current || 0);
      const rawProgress = Math.min(elapsed / totalDuration, 1);
      
      // Cubic ease-out for smooth, premium feel
      const eased = 1 - Math.pow(1 - rawProgress, 3);
      setProgress(eased * 100);

      if (rawProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(animateProgress);
      }
    };

    // Cycle through status messages
    statusInterval = setInterval(() => {
      if (statusIndex < statusMessages.length - 1) {
        statusIndex++;
        setCurrentStatusIndex(statusIndex);
      } else {
        // Last message - show "Ready." then complete
        clearInterval(statusInterval);
        setShowReady(true);
        
        // Pause briefly on "Ready."
        setTimeout(() => {
          // Begin exit sequence
          setIsVisible(false);
          setTimeout(() => {
            setShouldRender(false);
            onComplete();
          }, 600); // Wait for fade out
        }, readyDelay);
      }
    }, statusDuration);

    // Start progress animation
    animateProgress();

    // Cleanup
    return () => {
      if (statusInterval) clearInterval(statusInterval);
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onComplete, prefersReducedMotion, statusMessages.length]);

  if (!shouldRender) return null;

  // Get current status text
  const currentStatus = showReady ? "Ready." : statusMessages[currentStatusIndex];
  const isReady = showReady;

  return (
    <div className={`boot-screen ${!isVisible ? 'boot-fade-out' : ''}`}>
      {/* Ambient background with subtle gradient movement */}
      <div className="boot-background">
        <div className="boot-ambient-glow" />
        <div className="boot-grid-overlay" />
      </div>

      {/* Floating particles */}
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

      {/* Main content */}
      <div className="boot-content">
        {/* Status text with fade transitions */}
        <div className="boot-status-wrapper" key={currentStatus}>
          <div className={`boot-status ${isReady ? 'boot-status-ready' : ''}`}>
            {currentStatus}
          </div>
        </div>

        {/* Loading bar */}
        <div className="boot-progress-wrapper">
          <div 
            className="boot-progress-bar"
            style={{ 
              width: `${progress}%`,
              opacity: isVisible ? 1 : 0
            }}
          />
        </div>

        {/* Subtle system indicator */}
        <div className="boot-system-indicator">
          <span className="boot-dot" />
          <span className="boot-dot" />
          <span className="boot-dot" />
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const { isUnlocked: isVaultUnlocked, isLoading: vaultLoading } = useVault();
  const { isUnlocked: isInsightsUnlocked, isLoading: insightsLoading } = useInsights();
  const [hasBooted, setHasBooted] = useState(false);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth"
    });
  }, [location.pathname]);

  const isSpecialPage = location.pathname === '/vault' || location.pathname === '/insights';

  return (
    <>
      {/* Boot sequence - only plays once on initial load */}
      {!hasBooted && (
        <BootSequence onComplete={() => setHasBooted(true)} />
      )}
      
      <div className={`main-container dark-mode ${hasBooted ? 'app-revealed' : 'app-hidden'}`}>
        <Navigation />
        
        <FadeIn transitionDuration={700}>
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route 
              path="/vault" 
              element={
                <ProtectedRoute 
                  isUnlocked={isVaultUnlocked} 
                  isLoading={vaultLoading}
                >
                  <VaultPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/insights" 
              element={
                <ProtectedRoute 
                  isUnlocked={isInsightsUnlocked} 
                  isLoading={insightsLoading}
                >
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
    </>
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