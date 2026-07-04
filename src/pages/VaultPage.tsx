import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVault } from '../hooks/useVault';

const Vault = lazy(() => import('../components/Vault'));

const VaultPage: React.FC = () => {
  const navigate = useNavigate();
  const { isUnlocked } = useVault();

  React.useEffect(() => {
    if (!isUnlocked) {
      navigate('/', { replace: true });
    }
  }, [isUnlocked, navigate]);

  if (!isUnlocked) {
    return null;
  }

  return (
    <div className="vault-page">
      <div className="vault-page-header">
        <button 
          className="vault-back-button"
          onClick={() => navigate('/')}
          aria-label="Back to home"
        >
          ← Back to Home
        </button>
        <h1>Secret Vault</h1>
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