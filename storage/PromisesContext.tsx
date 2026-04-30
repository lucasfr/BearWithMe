// ─── PromisesContext ──────────────────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Promise } from '../types/promise';
import { loadPromises, savePromises } from './storage';

interface PromisesContextValue {
  promises: Promise[];
  addPromise:    (p: Promise) => Promise<void>;
  updatePromise: (p: Promise) => Promise<void>;
  deletePromise: (id: string) => Promise<void>;
  reload:        () => Promise<void>;
}

const PromisesContext = createContext<PromisesContextValue | null>(null);

export function PromisesProvider({ children }: { children: React.ReactNode }) {
  const [promises, setPromises] = useState<Promise[]>([]);

  const reload = async () => {
    const data = await loadPromises();
    setPromises(data);
  };

  useEffect(() => { reload(); }, []);

  const add = async (p: Promise) => {
    const next = [p, ...promises];
    setPromises(next);
    await savePromises(next);
  };

  const update = async (updated: Promise) => {
    const next = promises.map(p => (p.id === updated.id ? updated : p));
    setPromises(next);
    await savePromises(next);
  };

  const remove = async (id: string) => {
    const next = promises.filter(p => p.id !== id);
    setPromises(next);
    await savePromises(next);
  };

  return (
    <PromisesContext.Provider
      value={{ promises, addPromise: add, updatePromise: update, deletePromise: remove, reload }}
    >
      {children}
    </PromisesContext.Provider>
  );
}

export function usePromises(): PromisesContextValue {
  const ctx = useContext(PromisesContext);
  if (!ctx) throw new Error('usePromises must be used inside <PromisesProvider>');
  return ctx;
}
