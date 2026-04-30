// ─── PromisesContext ──────────────────────────────────────────────────────────

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import { Promise as BwmPromise } from '../types/promise';
import { loadPromises, savePromises } from './storage';

interface PromisesContextValue {
  promises:      BwmPromise[];
  addPromise:    (p: BwmPromise) => Promise<void>;
  updatePromise: (p: BwmPromise) => Promise<void>;
  deletePromise: (id: string)    => Promise<void>;
  reload:        ()              => Promise<void>;
}

const PromisesContext = createContext<PromisesContextValue | null>(null);

export function PromisesProvider({ children }: { children: React.ReactNode }) {
  const [promises, setPromises] = useState<BwmPromise[]>([]);

  const reload = useCallback(async () => {
    const data = await loadPromises();
    setPromises(data);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const addPromise = useCallback(async (p: BwmPromise) => {
    setPromises(prev => {
      const next = [p, ...prev];
      savePromises(next);
      return next;
    });
  }, []);

  const updatePromise = useCallback(async (updated: BwmPromise) => {
    setPromises(prev => {
      const next = prev.map(p => (p.id === updated.id ? updated : p));
      savePromises(next);
      return next;
    });
  }, []);

  const deletePromise = useCallback(async (id: string) => {
    setPromises(prev => {
      const next = prev.filter(p => p.id !== id);
      savePromises(next);
      return next;
    });
  }, []);

  const value = useMemo<PromisesContextValue>(
    () => ({ promises, addPromise, updatePromise, deletePromise, reload }),
    [promises, addPromise, updatePromise, deletePromise, reload],
  );

  return (
    <PromisesContext.Provider value={value}>
      {children}
    </PromisesContext.Provider>
  );
}

export function usePromises(): PromisesContextValue {
  const ctx = useContext(PromisesContext);
  if (!ctx) throw new Error('usePromises must be used inside <PromisesProvider>');
  return ctx;
}
