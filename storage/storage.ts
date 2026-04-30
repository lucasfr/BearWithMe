// ─── AsyncStorage helpers ──────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Promise } from '../types/promise';

const PROMISES_KEY = '@bwm:promises';

export async function loadPromises(): Promise<Promise[]> {
  try {
    const raw = await AsyncStorage.getItem(PROMISES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function savePromises(promises: Promise[]): Promise<void> {
  await AsyncStorage.setItem(PROMISES_KEY, JSON.stringify(promises));
}

export async function addPromise(promise: Promise): Promise<void> {
  const all = await loadPromises();
  await savePromises([promise, ...all]);
}

export async function updatePromise(updated: Promise): Promise<void> {
  const all = await loadPromises();
  await savePromises(all.map(p => (p.id === updated.id ? updated : p)));
}

export async function deletePromise(id: string): Promise<void> {
  const all = await loadPromises();
  await savePromises(all.filter(p => p.id !== id));
}
