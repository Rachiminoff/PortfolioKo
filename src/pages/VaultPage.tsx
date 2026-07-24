import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useArchive } from '../hooks/useArchive';

import "./styles/VaultPage.scss";

const Vault = lazy(() => import('../components/Vault'));

const VaultPage: React.FC = () => {
  const navigate = useNavigate();
  const { isUnlocked, isLoading } = useArchive();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!isLoading && !isUnlocked && !hasRedirected) {
      setHasRedirected(true);
      navigate('/archive', { replace: true });
    }
    
    if (isUnlocked && hasRedirected) {
      setHasRedirected(false);
    }
  }, [isLoading, isUnlocked, navigate, hasRedirected]);

  if (isLoading) {
    return (
      <div className="vault-loading-state">
        <div className="vault-loading-spinner" />
        <p>Verifying access</p>
      </div>
    );
  }

  if (!isUnlocked) {
    return null;
  }

  return (
    <div className="vault-page">
      {/* Background Layers */}
      <div className="vault-bg-grid" />
      <div className="vault-ambient-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>
      <div className="vault-vignette" />

      {/* Header */}
      <header className="vault-page-header">
        <button 
          className="vault-back-button"
          onClick={() => navigate('/archive')}
          aria-label="Back to archive"
        >
          <Icon icon="mdi:arrow-left" />
          <span>Back</span>
        </button>
        <div className="vault-header-divider" />
        <h1 className="vault-page-title">Vault</h1>
        <div className="vault-header-badge">
          <span className="badge-dot" />
          <span>Encrypted</span>
        </div>
      </header>

      {/* Vault Content */}
      <div className="vault-content-wrapper">
        <Suspense fallback={
          <div className="vault-loading-state">
            <div className="vault-loading-spinner" />
            <p>Loading vault contents</p>
          </div>
        }>
          <Vault />
        </Suspense>
      </div>
    </div>
  );
};

export default VaultPage;