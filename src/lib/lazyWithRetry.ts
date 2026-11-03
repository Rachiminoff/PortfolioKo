import { ComponentType, lazy } from 'react';

const RELOAD_KEY = 'chunk-reload-at';
const RELOAD_WINDOW_MS = 15_000;

/**
 * React.lazy that survives a stale deploy: if a chunk fails to load (its hashed filename no
 * longer exists), reload once to pick up the new index.html. A second failure inside the
 * window is rethrown so the ErrorBoundary can show a message instead of looping forever.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      let recentlyReloaded = false;
      try {
        const last = Number(window.sessionStorage.getItem(RELOAD_KEY) || 0);
        recentlyReloaded = Date.now() - last < RELOAD_WINDOW_MS;
        if (!recentlyReloaded) window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
      } catch {
        recentlyReloaded = true; // storage unavailable: don't risk a reload loop
      }
      if (!recentlyReloaded) {
        window.location.reload();
        return new Promise<never>(() => undefined); // keep Suspense showing until the reload
      }
      throw error;
    }
  });
}
