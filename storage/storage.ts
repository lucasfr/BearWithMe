// ─── AsyncStorage helpers ──────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Promise as BwmPromise } from '../types/promise';

const PROMISES_KEY = '@bwm:promises';

export async function loadPromises(): Promise<BwmPromise[]> {
  try {
    const raw = await AsyncStorage.getItem(PROMISES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function savePromises(promises: BwmPromise[]): Promise<void> {
  await AsyncStorage.setItem(PROMISES_KEY, JSON.stringify(promises));
}
