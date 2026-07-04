import { useState, useEffect, useCallback } from 'react';

export const useVault = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkUnlockStatus = useCallback(() => {
    const unlocked = sessionStorage.getItem('vaultUnlocked') === 'true';
    console.log('useVault - checking sessionStorage:', unlocked);
    setIsUnlocked(unlocked);
    return unlocked;
  }, []);

  useEffect(() => {
    checkUnlockStatus();
    setIsLoading(false);
  }, [checkUnlockStatus]);

  const unlockVault = useCallback(() => {
    console.log('useVault - unlocking vault');
    sessionStorage.setItem('vaultUnlocked', 'true');
    setIsUnlocked(true);
  }, []);

  const lockVault = useCallback(() => {
    console.log('useVault - locking vault');
    sessionStorage.removeItem('vaultUnlocked');
    setIsUnlocked(false);
  }, []);

  return { isUnlocked, isLoading, unlockVault, lockVault, checkUnlockStatus };
};