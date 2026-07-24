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
        <p>Verifying access...</p>
      </div>
    );
  }

  if (!isUnlocked) {
    return null;
  }

  return (
    <div className="vault-page">
      <div className="vault-bg-grid" />
      <div className="vault-ambient">
        <div className="vault-ring outer" />
        <div className="vault-ring inner" />
      </div>
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
          <div className="vault-header-divider" />
          <h1 className="vault-page-title">Vault</h1>
          <span className="vault-header-badge">Encrypted</span>
        </div>

        <Suspense fallback={
          <div className="vault-loading-state">
            <div className="vault-loading-spinner" />
            <p>Loading archive...</p>
          </div>
        }>
          <Vault />
        </Suspense>
      </div>
    </div>
  );
};

export default VaultPage;