// ─── Core domain types ────────────────────────────────────────────────────────

export type UrgencyLevel = 0 | 1 | 2 | 3;
// 0 = none (faded 🔥), 1 = low (🔥), 2 = soon (🔥🔥), 3 = urgent (🔥🔥🔥)

export type FuzzyDeadline = 'none' | 'this-week' | 'this-month' | 'specific';

export type PromiseStatus = 'pending' | 'kept' | 'overdue';

export interface Promise {
  id: string;
  text: string;                    // "Send the budget summary to the team"
  urgency: UrgencyLevel;
  toWhom: string;                  // free text: "team", "Mia", "myself"
  fuzzyDeadline: FuzzyDeadline;
  specificDate?: string;           // ISO date string e.g. "2025-05-02"
  context?: string;                // optional note / memory jog
  status: PromiseStatus;
  createdAt: string;               // ISO datetime
  keptAt?: string;                 // ISO datetime, set when marked kept
  scoreHowWell?: number;           // 1–5 bear score
  scoreHowFelt?: number;           // 1–5 heart score
  reflection?: string;             // optional post-grading note
}
