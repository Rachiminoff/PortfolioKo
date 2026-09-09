import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useArchive } from '../hooks/useArchive';

import './styles/InsightsPage.scss';

const Insights = lazy(() => import('../components/Insights'));

const InsightsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isUnlocked, isLoading } = useArchive();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    console.log('InsightsPage - State:', { isLoading, isUnlocked, hasRedirected });

    // Only redirect once when loading is complete and not unlocked
    if (!isLoading && !isUnlocked && !hasRedirected) {
      console.log('InsightsPage - Not unlocked, redirecting to archive');
      setHasRedirected(true);
      navigate('/archive', { replace: true });
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
      {/* Sticky Back Button */}
      <div className="insights-back-button-container">
        <button
          className="insights-back-button"
          onClick={() => {
            console.log('InsightsPage - Going back to archive');
            navigate('/archive');
          }}
          aria-label="Back to archive"
        >
          <Icon icon="mdi:arrow-left" width={18} height={18} />
          <span>Back to Archive</span>
        </button>
      </div>

      <Suspense
        fallback={
          <div className="insights-loading-state">
            <div className="insights-loading-spinner" />
            <p>Loading articles...</p>
          </div>
        }
      >
        <Insights />
      </Suspense>
    </div>
  );
};

export default InsightsPage;
