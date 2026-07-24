import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useArchive } from '../hooks/useArchive';

import "./styles/VaultPage.scss";

// Lazy load Vault component
const Vault = lazy(() => import('../components/Vault'));

const VaultPage: React.FC = () => {
  const navigate = useNavigate();
  const { isUnlocked, isLoading } = useArchive();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isLoading && !isUnlocked && !hasRedirected) {
      setHasRedirected(true);
      navigate('/archive', { replace: true });
    }
    
    if (isUnlocked && hasRedirected) {
      setHasRedirected(false);
    }
  }, [isLoading, isUnlocked, navigate, hasRedirected]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="vault-loading-state">
        <div className="vault-loading-spinner" />
        <p>Verifying access...</p>
      </div>
    );
  }

  // Handle locked state
  if (!isUnlocked) {
    return null;
  }

  // Error boundary for Vault component
  const handleError = (err: Error) => {
    console.error('Vault loading error:', err);
    setError(err);
  };

  if (error) {
    return (
      <div className="vault-page">
        <div className="vault-ambient-shapes" aria-hidden="true">
          <div className="shape shape-1">
            <div className="shape-ring outer" />
            <div className="shape-ring inner" />
          </div>
          <div className="shape shape-2" />
          <div className="shape shape-3">
            <div className="shape-ring outer" />
            <div className="shape-ring inner" />
          </div>
        </div>
        <div className="vault-bg-grid" />
        <div className="vault-vignette" />

        <div className="vault-container">
          <div className="vault-page-header">
            <button 
              className="vault-back-button"
              onClick={() => navigate('/archive')}
              aria-label="Back to archive"
            >
              <Icon icon="mdi:arrow-left" />
              <span>Back</span>
            </button>
            <div className="vault-header-group">
              <div className="vault-header-badge">
                <span className="badge-dot" />
                <span>Error</span>
              </div>
              <h1 className="vault-header-title">Vault</h1>
              <p className="vault-header-subtitle">Unable to load contents</p>
            </div>
          </div>
          <div className="vault-divider" />
          <div className="vault-error-state">
            <Icon icon="mdi:alert-circle" />
            <p>Failed to load vault contents</p>
            <button 
              className="vault-retry-button"
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vault-page">
      {/* Ambient Shapes */}
      <div className="vault-ambient-shapes" aria-hidden="true">
        <div className="shape shape-1">
          <div className="shape-ring outer" />
          <div className="shape-ring inner" />
        </div>
        <div className="shape shape-2" />
        <div className="shape shape-3">
          <div className="shape-ring outer" />
          <div className="shape-ring inner" />
        </div>
      </div>

      {/* Background Grid */}
      <div className="vault-bg-grid" />
      <div className="vault-vignette" />

      <div className="vault-container">
        <div className="vault-page-header">
          <button 
            className="vault-back-button"
            onClick={() => navigate('/archive')}
            aria-label="Back to archive"
          >
            <Icon icon="mdi:arrow-left" />
            <span>Back</span>
          </button>
          <div className="vault-header-group">
            <div className="vault-header-badge">
              <span className="badge-dot" />
              <span>Private</span>
              <span className="badge-divider" />
              <span>Encrypted</span>
            </div>
            <h1 className="vault-header-title">Vault</h1>
            <p className="vault-header-subtitle">Personal files and hidden content</p>
          </div>
        </div>

        <div className="vault-divider" />

        <Suspense 
          fallback={
            <div className="vault-loading-state">
              <div className="vault-loading-spinner" />
              <p>Loading vault contents...</p>
            </div>
          }
        >
          <React.Suspense fallback={null}>
            <Vault />
          </React.Suspense>
        </Suspense>
      </div>
    </div>
  );
};

export default VaultPage;