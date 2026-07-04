import { useState, useEffect, useCallback } from 'react';

export const useInsights = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkUnlockStatus = useCallback(() => {
    const unlocked = localStorage.getItem("blogUnlocked") === "true";
    console.log('useInsights - checking localStorage:', unlocked);
    setIsUnlocked(unlocked);
    return unlocked;
  }, []);

  useEffect(() => {
    checkUnlockStatus();
    setIsLoading(false);
  }, [checkUnlockStatus]);

  const unlockInsights = useCallback(() => {
    console.log('useInsights - unlocking insights');
    localStorage.setItem("blogUnlocked", "true");
    setIsUnlocked(true);
  }, []);

  const lockInsights = useCallback(() => {
    console.log('useInsights - locking insights');
    localStorage.removeItem("blogUnlocked");
    setIsUnlocked(false);
  }, []);

  return { isUnlocked, isLoading, unlockInsights, lockInsights, checkUnlockStatus };
};