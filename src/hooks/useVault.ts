import { useState, useEffect, useCallback, useRef } from 'react';

export const useVault = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasCheckedRef = useRef(false);

  const verifyServerSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/vault/verify", {
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

  // Re-check when the route changes to /vault
  useEffect(() => {
    const handleRouteChange = () => {
      if (window.location.pathname === '/vault' && !isUnlocked) {
        verifyServerSession();
      }
    };

    // Check on popstate (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isUnlocked, verifyServerSession]);

  const unlockVault = useCallback(() => {
    setIsUnlocked(true);
  }, []);

  const lockVault = useCallback(async () => {
    try {
      await fetch("/api/vault/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    }
    setIsUnlocked(false);
  }, []);

  return { isUnlocked, isLoading, unlockVault, lockVault, verifyServerSession };
};