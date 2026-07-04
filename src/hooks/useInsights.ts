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
        credentials: 'include', // Important: Send cookies
      });
      
      const data = await response.json();
      console.log('Insights session valid:', data.valid);
      setIsUnlocked(data.valid === true);
      return data.valid === true;
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

  const unlockInsights = useCallback(() => {
    setIsUnlocked(true);
  }, []);

  const lockInsights = useCallback(async () => {
    try {
      await fetch("/api/insights/logout", { 
        method: "POST",
        credentials: 'include',
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    setIsUnlocked(false);
  }, []);

  return { isUnlocked, isLoading, unlockInsights, lockInsights, verifyServerSession };
};