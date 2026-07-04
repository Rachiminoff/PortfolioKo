import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInsights } from '../hooks/useInsights';

const Insights = lazy(() => import('../components/Insights'));

const InsightsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isUnlocked, isLoading } = useInsights();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    console.log('InsightsPage - State:', { isLoading, isUnlocked, hasRedirected });
    
    // Only redirect once when loading is complete and not unlocked
    if (!isLoading && !isUnlocked && !hasRedirected) {
      console.log('InsightsPage - Not unlocked, redirecting to home');
      setHasRedirected(true);
      navigate('/', { replace: true });
    }
    
    if (isUnlocked && hasRedirected) {
      setHasRedirected(false);
    }
  }, [isLoading, isUnlocked, navigate, hasRedirected]);

  if (isLoading) {
    return (
      <div className="insights-loading-state">
        <div className="insights-loading-spinner" />
        <p>Verifying access...</p>
      </div>
    );
  }

  if (!isUnlocked) {
    console.log('InsightsPage - Not unlocked, returning null');
    return null;
  }

  console.log('InsightsPage - Rendering insights');

  return (
    <div className="insights-page">
      <div className="insights-page-header">
        <button 
          className="insights-back-button"
          onClick={() => {
            console.log('InsightsPage - Going back to home');
            navigate('/');
          }}
          aria-label="Back to home"
        >
          ← Back to Home
        </button>
        <h1>Insights</h1>
      </div>
      <Suspense fallback={
        <div className="insights-loading-state">
          <div className="insights-loading-spinner" />
          <p>Loading articles...</p>
        </div>
      }>
        <Insights />
      </Suspense>
    </div>
  );
};

export default InsightsPage;