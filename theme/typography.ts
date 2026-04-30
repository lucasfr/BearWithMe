// ─── Bear with Me — typography tokens ─────────────────────────────────────────
// All fonts are variable fonts — one file covers all weights.

export const FONTS = {
  heading:       'LibreBaskerville',
  headingItalic: 'LibreBaskerville-Italic',
  body:          'SourceSans3',
  bodyItalic:    'SourceSans3-Italic',
} as const;

export const SIZES = {
  screenTitle:  22,
  cardTitle:    17,
  body:         15,
  bodySmall:    13,
  label:        10,
  caption:      11,
  emoji:        28,
} as const;

export const RADIUS = {
  card:  14,
  pill:  99,
  btn:   14,
  small: 10,
} as const;
