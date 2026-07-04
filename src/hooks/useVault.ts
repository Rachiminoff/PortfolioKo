import { useState, useEffect } from 'react';

export const useVault = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const unlocked = sessionStorage.getItem('vaultUnlocked') === 'true';
    setIsUnlocked(unlocked);
  }, []);

  const unlockVault = () => {
    sessionStorage.setItem('vaultUnlocked', 'true');
    setIsUnlocked(true);
  };

  const lockVault = () => {
    sessionStorage.removeItem('vaultUnlocked');
    setIsUnlocked(false);
  };

  return { isUnlocked, unlockVault, lockVault };
};