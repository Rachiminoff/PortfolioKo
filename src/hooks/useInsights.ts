import { useState, useEffect, useCallback, useRef } from 'react';

export const useInsights = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasCheckedRef = useRef(false);

  const verifyServerSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/insights/verify", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setIsUnlocked(data.valid);
      return data.valid;
    } catch (error) {
      console.error("Session verification failed:", error);
      setIsUnlocked(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check on mount
  useEffect(() => {
    if (!hasCheckedRef.current) {
      hasCheckedRef.current = true;
      verifyServerSession();
    }
  }, [verifyServerSession]);

  // Re-check when the route changes to /insights
  useEffect(() => {
    const handleRouteChange = () => {
      if (window.location.pathname === '/insights' && !isUnlocked) {
        verifyServerSession();
      }
    };

    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isUnlocked, verifyServerSession]);

  const unlockInsights = useCallback(() => {
    setIsUnlocked(true);
  }, []);

  const lockInsights = useCallback(async () => {
    try {
      await fetch("/api/insights/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    }
    setIsUnlocked(false);
  }, []);

  return { isUnlocked, isLoading, unlockInsights, lockInsights, verifyServerSession };
};