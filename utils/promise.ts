// ─── Promise helpers ──────────────────────────────────────────────────────────

import { Promise, PromiseStatus, UrgencyLevel } from '../types/promise';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function computeStatus(p: Promise): PromiseStatus {
  if (p.status === 'kept') return 'kept';
  if (p.specificDate) {
    const due = new Date(p.specificDate);
    if (due < new Date()) return 'overdue';
  }
  return 'pending';
}

export const FLAMES: Record<UrgencyLevel, string> = {
  0: '🔥',
  1: '🔥',
  2: '🔥🔥',
  3: '🔥🔥🔥',
};

export function groupPromises(promises: Promise[]): {
  overdue: Promise[];
  thisWeek: Promise[];
  upcoming: Promise[];
  kept: Promise[];
} {
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + 7);

  return {
    overdue: promises.filter(p => computeStatus(p) === 'overdue'),
    thisWeek: promises.filter(p => {
      if (p.status !== 'pending') return false;
      if (p.fuzzyDeadline === 'this-week') return true;
      if (p.specificDate) {
        const d = new Date(p.specificDate);
        return d >= now && d <= weekEnd;
      }
      return false;
    }),
    upcoming: promises.filter(p => {
      if (p.status !== 'pending') return false;
      if (p.fuzzyDeadline === 'this-month' || p.fuzzyDeadline === 'none') return true;
      if (p.specificDate) {
        const d = new Date(p.specificDate);
        return d > weekEnd;
      }
      return false;
    }),
    kept: promises
      .filter(p => p.status === 'kept')
      .sort((a, b) => (b.keptAt ?? '').localeCompare(a.keptAt ?? ''))
      .slice(0, 10),
  };
}
