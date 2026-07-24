import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
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

// Boot Sequence Component - Swiss Style
function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);
  const [status, setStatus] = useState('Initializing');
  const animationFrameRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  const statusMessages = [
    'Initializing',
    'Loading interface',
    'Preparing modules',
    'Compiling assets',
    'Connecting components',
    'Rendering layout',
    'Finalizing'
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
      }, 800);
      return () => clearTimeout(timer);
    }

    const totalDuration = 1600;
    const statusDuration = totalDuration / statusMessages.length;

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
        }, 200);
      }
    };

    animateProgress();

    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onComplete, prefersReducedMotion]);

  if (!shouldRender) return null;

  return (
    <div className={`boot-screen ${!isVisible ? 'boot-fade-out' : ''}`}>
      <div className="boot-background">
        <div className="boot-grid-overlay" />
      </div>
      <div className="boot-content">
        <div className="boot-brand">
          <span className="boot-brand-name">TDY.dev</span>
        </div>
        <div className="boot-status-wrapper">
          <div className="boot-status">
            {status}
            <span className="boot-ellipsis">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </div>
        </div>
        <div className="boot-progress-wrapper">
          <div 
            className="boot-progress-bar"
            style={{ width: `${progress}%` }}
          />
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
  const { isUnlocked: isArchiveUnlocked, isLoading: archiveLoading } = useArchive();
  const [isReady, setIsReady] = useState(false);

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