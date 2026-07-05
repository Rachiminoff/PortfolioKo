import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVault } from '../hooks/useVault';

import "./styles/VaultPage.scss";

const Vault = lazy(() => import('../components/Vault'));

const VaultPage: React.FC = () => {
  const navigate = useNavigate();
  const { isUnlocked, isLoading } = useVault();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    console.log('VaultPage - State:', { isLoading, isUnlocked, hasRedirected });
    
    // Only redirect once when loading is complete and not unlocked
    if (!isLoading && !isUnlocked && !hasRedirected) {
      console.log('VaultPage - Not unlocked, redirecting to home');
      setHasRedirected(true);
      navigate('/', { replace: true });
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
    console.log('VaultPage - Not unlocked, returning null');
    return null;
  }

  console.log('VaultPage - Rendering vault');

  return (
    <div className="vault-page">
      <div className="vault-page-header">
        <button 
          className="vault-back-button"
          onClick={() => {
            console.log('VaultPage - Going back to home');
            navigate('/');
          }}
          aria-label="Back to home"
        >
          ← Back to Home
        </button>
        <h1>Vault</h1>
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
  );
};

export default VaultPage;