import React, { Suspense, lazy, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useArchive } from '../hooks/useArchive';
import './styles/ArchivePage.scss';

// Lazy load components
const Vault = lazy(() => import('../components/Vault'));
const Insights = lazy(() => import('../components/Insights'));

/* =========================
   AMBIENT SHAPES - ARCHITECTURAL
========================= */
function AmbientShapes() {
  return (
    <div className="ambient-shapes" aria-hidden="true">
      <div className="shape shape-1">
        <div className="shape-ring outer" />
        <div className="shape-ring inner" />
      </div>
      <div className="shape shape-2">
        <div className="shape-ring outer" />
        <div className="shape-ring inner" />
      </div>
      <div className="shape shape-3" />
      <div className="shape shape-4" />
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
        <div className="archive-auth-brackets">
          <span className="bracket tl" />
          <span className="bracket tr" />
          <span className="bracket bl" />
          <span className="bracket br" />
        </div>

        <div className="archive-auth-icon">
          <Icon icon="mdi:lock-outline" />
        </div>

        <h1 className="archive-auth-title">Archive</h1>
        <p className="archive-auth-subtitle">Private collection</p>

        {isLocked ? (
          <div className="archive-auth-locked">
            <Icon icon="mdi:clock-alert" />
            <p>Too many failed attempts.</p>
            <span>Please try again later</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="archive-auth-form">
            <div className="archive-password-wrapper">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter access code"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            <button
              type="submit"
              className="archive-auth-button"
              disabled={loading || !password.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Unlocking
                </>
              ) : (
                <>
                  Unlock
                  <Icon icon="mdi:arrow-right" />
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
      description: 'Personal files and hidden content',
      color: '#6366f1',
      featured: true,
    },
    {
      id: 'insights' as const,
      icon: 'mdi:notebook',
      title: 'Insights',
      description: 'Technical articles and writings',
      color: '#8b5cf6',
      featured: false,
    },
    {
      id: 'wish' as const,
      icon: 'mdi:star-four-points',
      title: 'Wish Archive',
      description: 'Genshin Impact wish history',
      color: '#f9b55d',
      featured: false,
    },
    {
      id: 'adashima' as const,
      icon: 'mdi:book-open-variant',
      title: 'AdaShima Stats',
      description: 'Light novel statistics',
      color: '#818cf8',
      featured: false,
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
          Back
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
          Back
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
          Back
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
          Back
        </button>
        <Suspense fallback={<div className="archive-loading">Loading Statistics...</div>}>
          <AdaShimaStatsPage />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="archive-dashboard">
      {/* Header */}
      <header className="archive-header">
        <div className="archive-header-content">
          <div className="archive-header-badge">
            <span className="badge-dot" />
            <span>Private workspace</span>
          </div>
          <h1 className="archive-header-title">Archive</h1>
          <p className="archive-header-description">
            A personal space for projects, records, writing, and things worth keeping
          </p>
          <div className="archive-header-actions">
            <button
              className="archive-home-button"
              onClick={() => navigate('/')}
              aria-label="Back to Home"
            >
              <Icon icon="mdi:home" />
              Home
            </button>
          </div>
        </div>
        <div className="archive-header-line" />
      </header>

      {/* Collections */}
      <section className="archive-collections">
        <div className="archive-collections-header">
          <h2 className="archive-collections-title">Explore the archive</h2>
          <p className="archive-collections-subtitle">Choose a space to continue where you left off</p>
        </div>

        <div className="archive-dashboard-grid">
          {cards.map((card, index) => (
            <button
              key={card.id}
              className={`archive-dashboard-card ${card.featured ? 'featured' : ''}`}
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
              style={{ 
                '--card-color': card.color,
                '--card-index': index
              } as React.CSSProperties}
            >
              <div className="archive-card-brackets">
                <span className="bracket tl" />
                <span className="bracket tr" />
                <span className="bracket bl" />
                <span className="bracket br" />
              </div>
              <div className="archive-card-icon" style={{ color: card.color }}>
                <Icon icon={card.icon} />
              </div>
              <h3 className="archive-card-title">{card.title}</h3>
              <p className="archive-card-description">{card.description}</p>
              <div className="archive-card-footer">
                <span className="archive-card-action">
                  Open space
                  <Icon icon="mdi:arrow-right" />
                </span>
              </div>
              <div className="archive-card-glow" style={{ background: `radial-gradient(circle at 50% 0%, ${card.color}30, transparent 70%)` }} />
            </button>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="archive-footer">
        <div className="archive-footer-divider" />
        <div className="archive-footer-content">
          <p className="archive-footer-title">Personal archive</p>
          <p className="archive-footer-description">
            A growing collection of work, records, and things worth revisiting.
          </p>
        </div>
        <div className="archive-footer-divider" />
      </footer>
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

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const handleUnlock = async (password: string) => {
    await unlockArchive(password);
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
      <div className="archive-bg-grid" />
      <AmbientShapes />
      <div className="archive-vignette" />

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