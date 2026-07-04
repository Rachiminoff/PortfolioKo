import React, { Suspense, lazy, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInsights } from '../hooks/useInsights';

const Insights = lazy(() => import('../components/Insights'));

const InsightsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isUnlocked, isLoading, verifyServerSession } = useInsights();

  useEffect(() => {
    // Re-check unlock status when the page loads
    const checkAccess = async () => {
      const isUnlockedNow = await verifyServerSession();
      console.log('InsightsPage - isUnlocked:', isUnlockedNow);
      
      if (!isUnlockedNow) {
        console.log('InsightsPage - redirecting to home');
        navigate('/', { replace: true });
      }
    };
    
    checkAccess();
  }, [verifyServerSession, navigate]);

  if (isLoading) {
    return (
      <div className="insights-loading-state">
        <div className="insights-loading-spinner" />
        <p>Verifying access...</p>
      </div>
    );
  }

  if (!isUnlocked) {
    return null;
  }

  console.log('InsightsPage - rendering insights');

  return (
    <div className="insights-page">
      <div className="insights-page-header">
        <button 
          className="insights-back-button"
          onClick={() => {
            console.log('InsightsPage - going back to home');
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