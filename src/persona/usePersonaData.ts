import { useEffect, useState } from 'react';
import type { PersonaData } from './types';

const EMPTY: PersonaData = { currently: [], favorites: {}, quotes: [] };

let cached: PersonaData | null = null;
let pending: Promise<PersonaData> | null = null;

function load(): Promise<PersonaData> {
  pending ||= fetch('/api/persona', { credentials: 'include' })
    .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
    .then((result) => (cached = { ...EMPTY, ...result.data }))
    .catch(() => {
      pending = null; // allow a retry on the next mount
      return EMPTY;
    });
  return pending;
}

/** Private Persona content is fetched from /api/persona (session-gated), not bundled. */
export function usePersonaData(): PersonaData {
  const [data, setData] = useState<PersonaData>(cached ?? EMPTY);
  useEffect(() => {
    let active = true;
    load().then((result) => active && setData(result));
    return () => {
      active = false;
    };
  }, []);
  return data;
}
