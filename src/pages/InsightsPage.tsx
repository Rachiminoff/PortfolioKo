import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInsights } from '../hooks/useInsights';

const Insights = lazy(() => import('../components/Insights'));

const InsightsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isUnlocked } = useInsights();

  React.useEffect(() => {
    if (!isUnlocked) {
      navigate('/', { replace: true });
    }
  }, [isUnlocked, navigate]);

  if (!isUnlocked) {
    return null;
  }

  return (
    <div className="insights-page">
      <div className="insights-page-header">
        <button 
          className="insights-back-button"
          onClick={() => navigate('/')}
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