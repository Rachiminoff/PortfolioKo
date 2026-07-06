import { useState, useEffect, useCallback } from 'react';

interface ArchiveState {
  isUnlocked: boolean;
  isLoading: boolean;
  error: string | null;
  remainingAttempts?: number;
  isLocked: boolean;
  lockedUntil?: string;
}

export function useArchive() {
  const [state, setState] = useState<ArchiveState>({
    isUnlocked: false,
    isLoading: true,
    error: null,
    remainingAttempts: undefined,
    isLocked: false,
    lockedUntil: undefined,
  });

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/archive/status', {
        credentials: 'include',
      });
      const data = await response.json();
      
      setState({
        isUnlocked: data.unlocked || false,
        isLoading: false,
        error: null,
        remainingAttempts: data.remainingAttempts,
        isLocked: data.locked || false,
        lockedUntil: data.lockedUntil,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to check authentication status',
      }));
    }
  }, []);

  const unlockArchive = useCallback(async (password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/archive/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setState({
          isUnlocked: true,
          isLoading: false,
          error: null,
          remainingAttempts: undefined,
          isLocked: false,
          lockedUntil: undefined,
        });
        return { success: true };
      } else if (data.locked) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Too many failed attempts',
          isLocked: true,
          lockedUntil: data.lockedUntil,
        }));
        return { success: false, error: 'Too many failed attempts' };
      } else if (data.remaining !== undefined) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Invalid password',
          remainingAttempts: data.remaining,
        }));
        return { success: false, error: 'Invalid password', remaining: data.remaining };
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Invalid password',
        }));
        return { success: false, error: 'Invalid password' };
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Something went wrong. Please try again.',
      }));
      return { success: false, error: 'Something went wrong' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/archive/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setState({
        isUnlocked: false,
        isLoading: false,
        error: null,
        remainingAttempts: undefined,
        isLocked: false,
        lockedUntil: undefined,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  return {
    ...state,
    unlockArchive,
    logout,
    checkAuthStatus,
  };
}