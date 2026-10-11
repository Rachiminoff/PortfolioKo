import React from 'react';
import './PersonaGate.scss';

interface PersonaGateProps {
  children: React.ReactNode;
  isUnlocked: boolean;
  isLoading?: boolean;
}

/**
 * Guards /persona. Anyone arriving without a valid unlock session (e.g. from a
 * shared link) sees a bare "skipped a step" page: no password field and no hint
 * about how to get in. Unlike ProtectedRoute it never redirects, so the URL
 * and the page itself reveal nothing.
 */
const PersonaGate: React.FC<PersonaGateProps> = ({ children, isUnlocked, isLoading = false }) => {
  // Render nothing while the session is being checked so the private page
  // never flashes, and the loading state doesn't hint at what's behind it.
  if (isLoading) return <div className="persona-gate" aria-busy="true" />;

  if (!isUnlocked) {
    return (
      <main className="persona-gate">
        <div className="persona-gate-card" role="alert">
          <span className="persona-gate-mark" aria-hidden="true" />
          <h1>
            Oops, you shouldn&rsquo;t
            <br />
            skip a step!
          </h1>
        </div>
      </main>
    );
  }

  return <>{children}</>;
};

export default PersonaGate;
