import React, { Suspense, lazy, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVault } from '../hooks/useVault';

const Vault = lazy(() => import('../components/Vault'));

const VaultPage: React.FC = () => {
  const navigate = useNavigate();
  const { isUnlocked, isLoading, verifyServerSession } = useVault();

  useEffect(() => {
    // Re-check unlock status when the page loads
    const checkAccess = async () => {
      const isUnlockedNow = await verifyServerSession();
      console.log('VaultPage - isUnlocked:', isUnlockedNow);
      
      if (!isUnlockedNow) {
        console.log('VaultPage - redirecting to home');
        navigate('/', { replace: true });
      }
    };
    
    checkAccess();
  }, [verifyServerSession, navigate]);

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

  console.log('VaultPage - rendering vault');

  return (
    <div className="vault-page">
      <div className="vault-page-header">
        <button 
          className="vault-back-button"
          onClick={() => {
            console.log('VaultPage - going back to home');
            navigate('/');
          }}
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