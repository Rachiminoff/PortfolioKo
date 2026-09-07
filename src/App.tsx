import React, { Suspense, lazy, useState, useEffect, useRef, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import {
  Timeline,
  Expertise,
  Terminal,
  Project,
  Contact,
  Footer,
} from "./components";
import FadeIn from "./components/FadeIn";
import Certificates from "./components/Certificates";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useArchive } from "./hooks/useArchive";
import { DefaultLayout, FullscreenLayout } from "./layouts";

import "./index.scss";

// Import the new Project components - ONLY ProjectDetailsPage
import ProjectDetailsPage from './components/ProjectDetailsPage';

// Lazy load pages
const MainPage = lazy(() => import('./pages/MainPage'));
const ArchivePage = lazy(() => import('./pages/ArchivePage'));
const VaultPage = lazy(() => import('./pages/VaultPage'));
const InsightsPage = lazy(() => import('./pages/InsightsPage'));
const WishArchivePage = lazy(() => import('./pages/WishArchivePage'));
const AdaShimaStatsPage = lazy(() => import('./pages/AdaShimaStatsPage'));

// Boot Sequence Component - CRT TV Style
function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);
  const [status, setStatus] = useState('TUNING');
  const [glitchActive, setGlitchActive] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  const statusMessages = useMemo(() => [
    'TUNING',
    'RECEIVING',
    'SCANNING',
    'DECODING',
    'SYNCHRONIZING',
    'RENDERING',
    'CONNECTED'
  ], []);

  const quantumLines = useMemo(() => [
    [50, 50, 8, 18], [50, 50, 18, 7], [50, 50, 31, 12], [50, 50, 44, 5],
    [50, 50, 58, 10], [50, 50, 72, 5], [50, 50, 86, 18], [50, 50, 94, 34],
    [50, 50, 91, 53], [50, 50, 82, 77], [50, 50, 67, 91], [50, 50, 49, 95],
    [50, 50, 31, 90], [50, 50, 16, 78], [50, 50, 6, 58], [50, 50, 12, 37],
    [50, 50, 27, 25], [50, 50, 64, 23], [50, 50, 78, 38], [50, 50, 70, 66],
    [50, 50, 35, 72], [50, 50, 24, 51], [50, 50, 61, 50], [50, 50, 42, 34]
  ], []);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Random glitch effect
  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 50 + Math.random() * 100);
      }
    }, 2000 + Math.random() * 3000);

    return () => clearInterval(glitchInterval);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          setShouldRender(false);
          onComplete();
        }, 400);
      }, 800);
      return () => clearTimeout(timer);
    }

    const totalDuration = 2000;

    let statusIndex = 0;
    startTimeRef.current = Date.now();

    const animateProgress = () => {
      const elapsed = Date.now() - (startTimeRef.current || 0);
      const rawProgress = Math.min(elapsed / totalDuration, 1);
      const eased = 1 - Math.pow(1 - rawProgress, 3);
      setProgress(eased * 100);

      const newStatusIndex = Math.min(
        Math.floor((elapsed / totalDuration) * statusMessages.length),
        statusMessages.length - 1
      );
      if (newStatusIndex !== statusIndex) {
        statusIndex = newStatusIndex;
        setStatus(statusMessages[statusIndex]);
      }

      if (rawProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(animateProgress);
      } else {
        setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => {
            setShouldRender(false);
            onComplete();
          }, 500);
        }, 300);
      }
    };

    animateProgress();

    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onComplete, prefersReducedMotion, statusMessages]);

  if (!shouldRender) return null;

  return (
    <div className={`boot-screen ${!isVisible ? 'boot-fade-out' : ''}`}>
      {/* CRT Curved Screen */}
      <div className="boot-crt-curve" />
      
      {/* Chromatic Aberration */}
      <div className="boot-chromatic" />
      
      {/* Scanlines */}
      <div className="boot-scanlines" />
      
      {/* Interlace */}
      <div className="boot-interlace" />
      
      {/* Static overlay */}
      <div className="boot-static" />
      
      {/* Noise particles */}
      <div className="boot-noise" />
      
      {/* TV Vignette */}
      <div className="boot-vignette" />
      
      {/* TV Frame */}
      <div className="boot-tv-frame" />
      
      {/* Glow effect */}
      <div className="boot-glow" />

      {/* Quantum state visualization */}
      <div className="boot-quantum-field" aria-hidden="true">
        <div className="boot-quantum-grid" />
        <div className="boot-quantum-orbit boot-quantum-orbit-a" />
        <div className="boot-quantum-orbit boot-quantum-orbit-b" />
        <svg className="boot-quantum-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
          {quantumLines.map(([x1, y1, x2, y2], index) => (
            <line
              key={`quantum-line-${index}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              className="boot-quantum-line"
              style={{ animationDelay: `${index * -0.11}s` }}
            />
          ))}
        </svg>
        <div className="boot-quantum-core">
          <span />
        </div>
        {Array.from({ length: 14 }, (_, index) => (
          <i key={`quantum-node-${index}`} className="boot-quantum-node" style={{ '--node-index': index } as React.CSSProperties} />
        ))}
      </div>
      
      {/* Content */}
      <div className={`boot-content ${glitchActive ? 'boot-glitch-active' : ''}`}>
        <div className="boot-brand">
          <div className="boot-channel">CH. 04</div>
          <span className="boot-brand-name">TDY.dev</span>
        </div>
        
        <div className="boot-status-wrapper">
          <div className="boot-status">
            {status}
            <span className="boot-ellipsis">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </div>
          <span className="boot-status-dot" />
        </div>
        
        <div className="boot-progress-wrapper">
          <div 
            className="boot-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="boot-progress-percent">
          {Math.round(progress)}%
        </div>
        
        <div className="boot-tuning">◀ ▶ TUNE</div>
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
  const { isUnlocked: isArchiveUnlocked, isLoading: archiveLoading } = useArchive();
  const [isReady, setIsReady] = useState(false);

  // Apply the persisted appearance before the routed page is displayed.
  // Navigation owns the toggle itself; this keeps direct visits to fullscreen
  // routes in the correct theme even when the navbar is not rendered there.
  useEffect(() => {
    let theme: "light" | "dark" = "dark";
    try {
      theme = localStorage.getItem("tdy-theme") === "light" ? "light" : "dark";
    } catch {
      // Use the default dark theme when storage is unavailable.
    }

    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
  }, []);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth"
    });
  }, [location.pathname]);

  useEffect(() => {
    if (!archiveLoading) {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [archiveLoading]);

  if (!isReady) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  const isFullscreenRoute = location.pathname === '/archive' ||
                            location.pathname === '/vault' || 
                            location.pathname === '/insights' || 
                            location.pathname === '/wish-archive' ||
                            location.pathname === '/adashima-stats';

  return (
    <div className={isFullscreenRoute ? 'route-transition' : 'main-container dark-mode route-transition'} key={location.pathname}>
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
          path="/projects/:slug" 
          element={
            <DefaultLayout>
              <ProjectDetailsPage />
            </DefaultLayout>
          } 
        />
        <Route 
          path="/archive" 
          element={
            <FullscreenLayout>
              <ArchivePage />
            </FullscreenLayout>
          } 
        />
        <Route 
          path="/vault" 
          element={
            <FullscreenLayout>
              <ProtectedRoute isUnlocked={isArchiveUnlocked} isLoading={archiveLoading} redirectTo="/archive">
                <VaultPage />
              </ProtectedRoute>
            </FullscreenLayout>
          } 
        />
        <Route 
          path="/insights" 
          element={
            <FullscreenLayout>
              <ProtectedRoute isUnlocked={isArchiveUnlocked} isLoading={archiveLoading} redirectTo="/archive">
                <InsightsPage />
              </ProtectedRoute>
            </FullscreenLayout>
          } 
        />
        <Route 
          path="/wish-archive" 
          element={
            <FullscreenLayout>
              <ProtectedRoute isUnlocked={isArchiveUnlocked} isLoading={archiveLoading} redirectTo="/archive">
                <WishArchivePage />
              </ProtectedRoute>
            </FullscreenLayout>
          } 
        />
        <Route 
          path="/adashima-stats" 
          element={
            <FullscreenLayout>
              <ProtectedRoute isUnlocked={isArchiveUnlocked} isLoading={archiveLoading} redirectTo="/archive">
                <AdaShimaStatsPage />
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