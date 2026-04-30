// ─── Shared modal / sheet style tokens ────────────────────────────────────────
// Import these in any bottom-sheet or modal to stay consistent.

export const MODAL_GLASS_BG       = 'rgba(255,255,255,0.72)';
export const MODAL_CHIP_BG        = 'rgba(255,255,255,0.60)';
export const MODAL_CHIP_ACTIVE_BG = 'rgba(166,123,91,0.28)';

export const MODAL_INPUT_SHADOW = {
  shadowColor: '#6F4E37',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.10,
  shadowRadius: 8,
  elevation: 3,
} as const;

export const MODAL_CHIP_SHADOW = {
  shadowColor: '#6F4E37',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.14,
  shadowRadius: 10,
  elevation: 4,
} as const;

export const MODAL_SHEET = {
  borderTopLeftRadius:  28,
  borderTopRightRadius: 28,
  borderTopWidth:       1.5,
  borderTopColor:       'rgba(255,255,255,0.80)',
  paddingHorizontal:    20,
  paddingTop:           14,
  maxHeight:            '92%' as const,
  overflow:             'hidden' as const,
} as const;

export const MODAL_HANDLE = {
  width:           40,
  height:          5,
  backgroundColor: 'rgba(111,78,55,0.18)',
  borderRadius:    99,
  alignSelf:       'center' as const,
  marginBottom:    20,
} as const;

export const MODAL_BACKDROP_COLOR = 'rgba(44,26,14,0.45)';
