// ─── Bear with Me — colour tokens ─────────────────────────────────────────────

export const COLOURS = {
  bg:          '#F5EFE6',
  bg2:         '#EDE4D8',
  text:        '#2C1A0E',
  textMuted:   '#8B6E58',
  textDim:     '#C4A98C',

  coffee1:     '#6F4E37',   // darkest — primary accent, urgent stripe
  coffee2:     '#A67B5B',   // mid — section labels, low urgency
  coffee3:     '#ECB176',   // warm — soon urgency
  coffee4:     '#FED8B1',   // lightest — empty Likert, backgrounds

  alert:       '#C0614A',   // overdue / urgent
  done:        '#6A8FA0',   // kept / completed

  glass:       'rgba(255,255,255,0.30)',
  glassBorder: 'rgba(255,255,255,0.38)',
  glassShadow: 'rgba(111,78,55,0.10)',
  headerBg:    'rgba(245,239,230,0.40)',
  entryBg:     'rgba(255,255,255,0.72)',
  drawerBg:    'rgba(250,245,238,0.97)',
} as const;

export const URGENCY_COLOURS: Record<number, string> = {
  0: COLOURS.textDim,
  1: COLOURS.coffee2,
  2: COLOURS.coffee3,
  3: COLOURS.alert,
};

export const URGENCY_FLAMES: Record<number, string> = {
  0: '🔥',
  1: '🔥',
  2: '🔥🔥',
  3: '🔥🔥🔥',
};
