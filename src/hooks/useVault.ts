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
        credentials: 'include',
      });
      
      if (!response.ok) {
        console.log('Vault verify response not OK:', response.status);
        setIsUnlocked(false);
        return false;
      }
      
      const data = await response.json();
      console.log('Vault session valid:', data.valid);
      
      // Update state based on the response
      const isValid = data.valid === true;
      setIsUnlocked(isValid);
      return isValid;
    } catch (error) {
      console.error("Session verification failed:", error);
      setIsUnlocked(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasCheckedRef.current) {
      hasCheckedRef.current = true;
      verifyServerSession();
    }
  }, [verifyServerSession]);

  const unlockVault = useCallback(() => {
    console.log('unlockVault called - setting isUnlocked to true');
    setIsUnlocked(true);
  }, []);

  const lockVault = useCallback(async () => {
    try {
      await fetch("/api/vault/logout", { 
        method: "POST",
        credentials: 'include',
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    setIsUnlocked(false);
  }, []);

  return { isUnlocked, isLoading, unlockVault, lockVault, verifyServerSession };
};