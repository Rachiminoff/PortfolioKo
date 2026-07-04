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
      console.log('Vault session valid:', data.valid);
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

  useEffect(() => {
    // Only check once on mount
    if (!hasCheckedRef.current) {
      hasCheckedRef.current = true;
      verifyServerSession();
    }
  }, [verifyServerSession]);

  const unlockVault = useCallback(() => {
    setIsUnlocked(true);
  }, []);

  return { isUnlocked, isLoading, unlockVault, verifyServerSession };
};