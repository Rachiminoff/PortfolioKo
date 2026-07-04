import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  isUnlocked: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  isUnlocked,
  redirectTo = '/',
}) => {
  if (!isUnlocked) {
    console.log('ProtectedRoute - Not unlocked, redirecting to:', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  console.log('ProtectedRoute - Access granted');
  return <>{children}</>;
};

export default ProtectedRoute;