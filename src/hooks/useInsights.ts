import { useState, useEffect } from 'react';

export const useInsights = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const unlocked = localStorage.getItem("blogUnlocked") === "true";
    setIsUnlocked(unlocked);
  }, []);

  const unlockInsights = () => {
    localStorage.setItem("blogUnlocked", "true");
    setIsUnlocked(true);
  };

  const lockInsights = () => {
    localStorage.removeItem("blogUnlocked");
    setIsUnlocked(false);
  };

  return { isUnlocked, unlockInsights, lockInsights };
};