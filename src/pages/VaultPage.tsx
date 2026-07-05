import React, { Suspense, lazy, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVault } from "../hooks/useVault";
import "./styles/VaultPage.scss";

const Vault = lazy(() => import("../components/Vault"));

const VaultPage: React.FC = () => {
  const navigate = useNavigate();
  const { isUnlocked, isLoading } = useVault();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!isLoading && !isUnlocked && !hasRedirected) {
      setHasRedirected(true);
      navigate("/", { replace: true });
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
      <header className="vault-page-header">
        <button
          className="vault-back-button"
          onClick={() => navigate("/")}
          aria-label="Back to home"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>

          <span>Back to Home</span>
        </button>
      </header>

      <Suspense
        fallback={
          <div className="vault-loading-state">
            <div className="vault-loading-spinner" />
            <p>Loading archive...</p>
          </div>
        }
      >
        <Vault />
      </Suspense>
    </div>
  );
};

export default VaultPage;