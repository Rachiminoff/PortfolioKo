import { useState, useEffect, useCallback } from 'react';

export const useInsights = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
      console.log('Server session valid:', data.valid);
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
    verifyServerSession();
  }, [verifyServerSession]);

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