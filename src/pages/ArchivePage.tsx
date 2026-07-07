import React, { Suspense, lazy, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useArchive } from '../hooks/useArchive';

import './styles/ArchivePage.scss';

// Lazy load components
const Vault = lazy(() => import('../components/Vault'));
const Insights = lazy(() => import('../components/Insights'));

/* =========================
   PARTICLE BACKGROUND
========================= */
function ArchiveParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    opacity: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };

    const initParticles = () => {
      const count = 40;
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.3 + 0.1,
      }));
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    resize();
    initParticles();
    animate();

    window.addEventListener('resize', () => {
      resize();
      initParticles();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="archive-particles" />;
}

/* =========================
   AMBIENT SHAPES
========================= */
function AmbientShapes() {
  return (
    <div className="ambient-shapes" aria-hidden="true">
      <div className="shape shape-1" />
      <div className="shape shape-2" />
      <div className="shape shape-3" />
    </div>
  );
}

/* =========================
   AUTHENTICATION SCREEN
========================= */
function AuthScreen({ 
  onUnlock, 
  loading, 
  error, 
  remainingAttempts, 
  isLocked 
}: {
  onUnlock: (password: string) => void;
  loading: boolean;
  error: string | null;
  remainingAttempts?: number;
  isLocked: boolean;
}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLocked) {
      inputRef.current?.focus();
    }
  }, [isLocked]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onUnlock(password);
    }
  };

  return (
    <div className="archive-auth">
      <div className="archive-auth-content">
        <div className="archive-auth-icon">
          <Icon icon="mdi:lock-outline" />
        </div>
        <h1 className="archive-auth-title">Archive</h1>
        <p className="archive-auth-subtitle">Private collection. Hidden content.</p>

        {isLocked ? (
          <div className="archive-auth-locked">
            <Icon icon="mdi:clock-alert" />
            <p>Too many failed attempts. Please try again later.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="archive-auth-form">
            <div className="archive-password-wrapper">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter access code..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                className={`archive-auth-input ${error ? 'error' : ''}`}
                disabled={loading}
                autoComplete="off"
                autoFocus
              />
              <button
                type="button"
                className="archive-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <Icon icon={showPassword ? 'mdi:eye' : 'mdi:eye-off'} />
              </button>
            </div>

            {error && (
              <div className="archive-auth-error">
                <Icon icon="mdi:alert-circle" />
                <span>{error}</span>
                {remainingAttempts !== undefined && remainingAttempts > 0 && (
                  <span className="attempts-badge">
                    {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} left
                  </span>
                )}
              </div>
            )}

            {remainingAttempts !== undefined && remainingAttempts > 0 && !error && (
              <div className="archive-auth-attempts">
                <div className="attempts-dots">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className={`attempt-dot ${i < remainingAttempts ? 'active' : 'used'}`}
                    />
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="archive-auth-button"
              disabled={loading || !password.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Unlocking...
                </>
              ) : (
                <>
                  Continue <Icon icon="mdi:arrow-right" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* =========================
   DASHBOARD
========================= */
function Dashboard({ onNavigate }: { onNavigate: (path: string) => void }) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'home' | 'vault' | 'insights' | 'wish' | 'adashima'>('home');

  const cards = [
    {
      id: 'vault' as const,
      icon: 'mdi:folder-lock',
      title: 'Vault',
      description: 'Personal files and hidden content.',
      color: '#6366f1',
    },
    {
      id: 'insights' as const,
      icon: 'mdi:notebook',
      title: 'Insights',
      description: 'Technical articles and writings.',
      color: '#8b5cf6',
    },
    {
      id: 'wish' as const,
      icon: 'mdi:star-four-points',
      title: 'Wish Archive',
      description: 'Genshin Impact wish history and analytics.',
      color: '#f9b55d',
    },
    {
      id: 'adashima' as const,
      icon: 'mdi:book-open-variant',
      title: 'AdaShima Stats',
      description: 'Light novel statistics and analytics.',
      color: '#818cf8',
    },
  ];

  // Handle section rendering
  if (activeSection === 'vault') {
    return (
      <div className="archive-section">
        <button
          className="archive-section-back"
          onClick={() => setActiveSection('home')}
        >
          <Icon icon="mdi:arrow-left" />
          Back to Archive
        </button>
        <Suspense fallback={<div className="archive-loading">Loading Vault...</div>}>
          <Vault />
        </Suspense>
      </div>
    );
  }

  if (activeSection === 'insights') {
    return (
      <div className="archive-section">
        <button
          className="archive-section-back"
          onClick={() => setActiveSection('home')}
        >
          <Icon icon="mdi:arrow-left" />
          Back to Archive
        </button>
        <Suspense fallback={<div className="archive-loading">Loading Insights...</div>}>
          <Insights />
        </Suspense>
      </div>
    );
  }

  if (activeSection === 'wish') {
    const WishArchivePage = lazy(() => import('../pages/WishArchivePage'));
    return (
      <div className="archive-section">
        <button
          className="archive-section-back"
          onClick={() => setActiveSection('home')}
        >
          <Icon icon="mdi:arrow-left" />
          Back to Archive
        </button>
        <Suspense fallback={<div className="archive-loading">Loading Wish Archive...</div>}>
          <WishArchivePage />
        </Suspense>
      </div>
    );
  }

  if (activeSection === 'adashima') {
    const AdaShimaStatsPage = lazy(() => import('../pages/AdaShimaStatsPage'));
    return (
      <div className="archive-section">
        <button
          className="archive-section-back"
          onClick={() => setActiveSection('home')}
        >
          <Icon icon="mdi:arrow-left" />
          Back to Archive
        </button>
        <Suspense fallback={<div className="archive-loading">Loading Statistics...</div>}>
          <AdaShimaStatsPage />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="archive-dashboard">
      <div className="archive-dashboard-header">
        <div className="archive-dashboard-title">
          <Icon icon="mdi:archive" />
          <h1>Archive</h1>
        </div>
        <div className="archive-dashboard-actions">
          <button
            className="archive-home-button"
            onClick={() => navigate('/')}
            aria-label="Back to Home"
          >
            <Icon icon="mdi:home" />
            Home
          </button>
          <p className="archive-dashboard-welcome">Welcome back.</p>
        </div>
      </div>

      <div className="archive-dashboard-grid">
        {cards.map((card) => (
          <button
            key={card.id}
            className="archive-dashboard-card"
            onClick={() => {
              if (card.id === 'vault') {
                setActiveSection('vault');
                onNavigate('/vault');
              } else if (card.id === 'insights') {
                setActiveSection('insights');
                onNavigate('/insights');
              } else if (card.id === 'wish') {
                setActiveSection('wish');
                onNavigate('/wish-archive');
              } else if (card.id === 'adashima') {
                setActiveSection('adashima');
                onNavigate('/adashima-stats');
              }
            }}
            style={{ '--card-color': card.color } as React.CSSProperties}
          >
            <div className="archive-card-icon">
              <Icon icon={card.icon} />
            </div>
            <h2 className="archive-card-title">{card.title}</h2>
            <p className="archive-card-description">{card.description}</p>
            <span className="archive-card-action">
              Open <Icon icon="mdi:arrow-right" />
            </span>
            <div className="archive-card-glow" />
          </button>
        ))}
      </div>

      {/* Future expansion placeholder */}
      <div className="archive-dashboard-footer">
        <p className="archive-dashboard-hint">
          More sections coming soon...
        </p>
      </div>
    </div>
  );
}

/* =========================
   MAIN ARCHIVE PAGE
========================= */
const ArchivePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    isUnlocked,
    isLoading,
    error,
    remainingAttempts,
    isLocked,
    unlockArchive,
    checkAuthStatus,
  } = useArchive();

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const handleUnlock = async (password: string) => {
    const result = await unlockArchive(password);
    if (result.success) {
      // No navigation needed - dashboard will render
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  if (isLoading) {
    return (
      <div className="archive-loading-state">
        <div className="archive-loading-spinner" />
        <p>Loading archive...</p>
      </div>
    );
  }

  return (
    <div className={`archive-page ${isLoaded ? 'loaded' : ''}`}>
      <div className="archive-bg-gradient" />
      <ArchiveParticles />
      <AmbientShapes />
      <div className="archive-noise" />

      <div className="archive-container">
        {isUnlocked ? (
          <Dashboard onNavigate={handleNavigate} />
        ) : (
          <AuthScreen
            onUnlock={handleUnlock}
            loading={isLoading}
            error={error}
            remainingAttempts={remainingAttempts}
            isLocked={isLocked}
          />
        )}
      </div>
    </div>
  );
};

export default ArchivePage;