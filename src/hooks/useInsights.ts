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
        credentials: 'include',
      });
      
      if (!response.ok) {
        console.log('Insights verify response not OK:', response.status);
        setIsUnlocked(false);
        return false;
      }
      
      const data = await response.json();
      console.log('Insights session valid:', data.valid);
      
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

  const unlockInsights = useCallback(() => {
    console.log('unlockInsights called - setting isUnlocked to true');
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