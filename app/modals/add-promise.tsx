import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, PanResponder, GestureResponderEvent, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePromises } from '../../storage/PromisesContext';
import { generateId } from '../../utils/promise';
import { Promise as BwmPromise, UrgencyLevel, FuzzyDeadline } from '../../types/promise';
import { COLOURS } from '../../theme/colours';
import { FONTS, SIZES, RADIUS } from '../../theme/typography';
import {
  MODAL_GLASS_BG as GLASS_BG,
  MODAL_CHIP_BG as CHIP_BG,
  MODAL_CHIP_ACTIVE_BG as CHIP_ACTIVE_BG,
  MODAL_INPUT_SHADOW as inputShadow,
  MODAL_CHIP_SHADOW as chipShadow,
  MODAL_SHEET,
  MODAL_HANDLE,
} from '../../theme/modal';

// ── Web date picker (replaces native <input type=date> on web) ────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function WebDatePicker({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const today = new Date();
  const [day,   setDay]   = useState(value.getDate());
  const [month, setMonth] = useState(value.getMonth());
  const [year,  setYear]  = useState(value.getFullYear());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days   = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const years  = Array.from({ length: 10 }, (_, i) => today.getFullYear() + i);

  const update = (d: number, m: number, y: number) => {
    const clamped = Math.min(d, new Date(y, m + 1, 0).getDate());
    setDay(clamped);
    onChange(new Date(y, m, clamped, 12));
  };

  const selectStyle = {
    flex: 1,
    padding: '11px 14px',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6F4E37',
    backgroundColor: 'rgba(255,255,255,0.60)',
    border: '1px solid rgba(196,169,140,0.35)',
    borderRadius: '999px',
    outline: 'none',
    boxShadow: '0 2px 8px rgba(111,78,55,0.10)',
    cursor: 'pointer',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236F4E37' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '32px',
  };

  return (
    <View style={wdp.row}>
      {/* @ts-ignore */}
      <select
        value={day}
        onChange={(e: any) => { const d = Number(e.target.value); setDay(d); update(d, month, year); }}
        style={selectStyle}
      >
        {days.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
      {/* @ts-ignore */}
      <select
        value={month}
        onChange={(e: any) => { const m = Number(e.target.value); setMonth(m); update(day, m, year); }}
        style={selectStyle}
      >
        {MONTHS.map((label, i) => <option key={i} value={i}>{label}</option>)}
      </select>
      {/* @ts-ignore */}
      <select
        value={year}
        onChange={(e: any) => { const y = Number(e.target.value); setYear(y); update(day, month, y); }}
        style={selectStyle}
      >
        {Array.from({ length: 10 }, (_, i) => today.getFullYear() + i).map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </View>
  );
}

const wdp = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
});

// ── FlameBar ───────────────────────────────────────────────────────────────
function FlameBar({ value, onChange }: { value: UrgencyLevel; onChange: (v: UrgencyLevel) => void }) {
  const rowRef = useRef<View>(null);
  const rowX   = useRef(0);
  const rowW   = useRef(0);

  const getLevel = (pageX: number): UrgencyLevel => {
    const rel = Math.max(0, Math.min(1, (pageX - rowX.current) / rowW.current));
    if (rel < 0.33) return 1;
    if (rel < 0.66) return 2;
    return 3;
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (e: GestureResponderEvent) => onChange(getLevel(e.nativeEvent.pageX)),
      onPanResponderMove:  (e: GestureResponderEvent) => onChange(getLevel(e.nativeEvent.pageX)),
    })
  ).current;

  return (
    <View
      ref={rowRef}
      onLayout={e => {
        rowW.current = e.nativeEvent.layout.width;
        rowRef.current?.measure((_x, _y, _w, _h, pageX) => { rowX.current = pageX; });
      }}
      {...pan.panHandlers}
      style={styles.flameRow}
    >
      {([1, 2, 3] as UrgencyLevel[]).map(u => (
        <TouchableOpacity
          key={u}
          style={styles.flamePip}
          onPress={() => onChange(value === u ? 0 : u)}
          activeOpacity={0.8}
        >
          <Text style={[styles.flameEmoji, u > value && styles.flameFaded]}>🔥</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function AddPromiseModal() {
  const router  = useRouter();
  const { id }  = useLocalSearchParams<{ id?: string }>();
  const insets  = useSafeAreaInsets();
  const { addPromise, updatePromise, promises } = usePromises();

  // Inject web-only CSS fixes at mount time
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const id = 'bwm-input-fix';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      textarea, input[type=text], input[type=date] {
        box-sizing: border-box !important;
        max-width: 100% !important;
        overflow: hidden !important;
        outline: none !important;
      }
      textarea:focus, input:focus {
        outline: none !important;
        box-shadow: 0 0 0 2px rgba(111,78,55,0.30) !important;
      }
      input[type=date] {
        accent-color: #6F4E37 !important;
        color-scheme: light;
      }
      input[type=date]::-webkit-calendar-picker-indicator {
        filter: sepia(1) saturate(4) hue-rotate(330deg) brightness(0.55);
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }, []);

  const existing = useMemo(
    () => (id ? promises.find(p => p.id === id) ?? null : null),
    [id, promises],
  );
  const isEditing = !!existing;

  const [text,    setText]    = useState(existing?.text ?? '');
  const [urgency, setUrgency] = useState<UrgencyLevel>(existing?.urgency ?? 1);
  const [toWhom,  setToWhom]  = useState(
    existing && ['myself', 'team'].includes(existing.toWhom) ? existing.toWhom : ''
  );
  const [customWho, setCustomWho] = useState(
    existing && !['myself', 'team'].includes(existing.toWhom) ? existing.toWhom : ''
  );
  const [fuzzy,    setFuzzy]    = useState<FuzzyDeadline>(
    existing?.fuzzyDeadline === 'specific' ? 'this-week' : (existing?.fuzzyDeadline ?? 'this-week')
  );
  const [showDate,    setShowDate]    = useState(existing?.fuzzyDeadline === 'specific');
  const [showPicker,  setShowPicker]  = useState(false);
  const [specificDate, setSpecificDate] = useState<Date>(
    existing?.specificDate && /^\d{4}-\d{2}-\d{2}$/.test(existing.specificDate)
      ? new Date(existing.specificDate + 'T12:00:00')
      : new Date()
  );
  const [context, setContext] = useState(existing?.context ?? '');

  const isoDate    = (d: Date) => d.toISOString().split('T')[0];
  const dateLabel  = specificDate.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  const handleSubmit = useCallback(async () => {
    if (!text.trim()) return;
    const who      = toWhom || customWho.trim() || 'myself';
    const deadline = showDate ? isoDate(specificDate) : undefined;

    if (isEditing && existing) {
      await updatePromise({
        ...existing,
        text: text.trim(), urgency, toWhom: who,
        fuzzyDeadline: showDate ? 'specific' : fuzzy,
        specificDate: deadline,
        context: context.trim() || undefined,
      });
    } else {
      await addPromise({
        id: generateId(),
        text: text.trim(), urgency, toWhom: who,
        fuzzyDeadline: showDate ? 'specific' : fuzzy,
        specificDate: deadline,
        context: context.trim() || undefined,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    }
    router.back();
  }, [text, urgency, toWhom, customWho, fuzzy, specificDate, showDate, context, isEditing, existing]);

  const WHEN_OPTIONS: { key: FuzzyDeadline; label: string }[] = [
    { key: 'none',       label: 'no rush'    },
    { key: 'this-week',  label: 'this week'  },
    { key: 'this-month', label: 'this month' },
    { key: 'specific',   label: 'specific'   },
  ];

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={() => router.back()} />

      <BlurView intensity={60} tint="light" style={[MODAL_SHEET, { paddingBottom: insets.bottom + 20 }]}>
        <View style={MODAL_HANDLE} />
        <View style={styles.titleRow}>
          <Text style={styles.title}>
            {isEditing ? 'Edit promise' : 'I promise to…'}
          </Text>
          <FlameBar value={urgency} onChange={setUrgency} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <Text style={styles.label}>The promise</Text>
          <View style={Platform.OS === 'web' ? styles.inputWrapper : undefined}>
            <TextInput
              style={[styles.glassInput, { minHeight: 64 }]}
              placeholder="describe what you promised…"
              placeholderTextColor={COLOURS.textMuted}
              selectionColor={COLOURS.coffee2}
              value={text}
              onChangeText={setText}
              multiline
              autoFocus={!isEditing}
            />
          </View>

          <Text style={styles.label}>To whom</Text>
          <View style={styles.chipRow}>
            {(['myself', 'team'] as const).map(w => (
              <TouchableOpacity
                key={w}
                style={[styles.chip, toWhom === w && styles.chipActive]}
                onPress={() => { setToWhom(prev => prev === w ? '' : w); setCustomWho(''); }}
              >
                <Text style={[styles.chipText, toWhom === w && styles.chipTextActive]}>
                  {w === 'myself' ? '🙋 myself' : '👥 team'}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={[Platform.OS === 'web' ? styles.whoInputWrapper : undefined, { flex: 1 }]}>
              <TextInput
                style={styles.whoInput}
                placeholder="someone else…"
                placeholderTextColor={COLOURS.textMuted}
                selectionColor={COLOURS.coffee2}
                value={customWho}
                onChangeText={v => { setCustomWho(v); if (v) setToWhom(''); }}
              />
            </View>
          </View>

          <Text style={styles.label}>When</Text>
          <View style={styles.whenRow}>
            {WHEN_OPTIONS.map(({ key, label }) => {
              const isActive = key === 'specific' ? showDate : (!showDate && fuzzy === key);
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.whenChip, isActive && styles.chipActive]}
                  onPress={() => {
                    if (key === 'specific') {
                      setShowDate(true);
                      setShowPicker(true); // open immediately
                    } else {
                      setFuzzy(key);
                      setShowDate(false);
                      setShowPicker(false);
                    }
                  }}
                >
                  <Text style={[styles.whenChipText, isActive && styles.chipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* When specific is selected: show date label + inline picker */}
          {showDate && showPicker && (
            Platform.OS === 'web' ? (
              <View style={styles.webDateWrapper}>
                <WebDatePicker
                  value={specificDate}
                  onChange={setSpecificDate}
                />
              </View>
            ) : (
              <DateTimePicker
                value={specificDate}
                mode="date"
                display="spinner"
                onChange={(_, date) => { if (date) setSpecificDate(date); }}
                textColor={COLOURS.text}
                accentColor={COLOURS.coffee1}
              />
            )
          )}

          {showDate && Platform.OS !== 'web' && (
            <TouchableOpacity
              style={styles.dateLabelRow}
              onPress={() => setShowPicker(p => !p)}
              activeOpacity={0.75}
            >
              <Text style={styles.dateLabelText}>📅 {dateLabel}</Text>
              <Text style={styles.dateLabelEdit}>{showPicker ? 'done ✓' : 'change'}</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.label}>
            Context{'  '}<Text style={styles.labelOptional}>optional</Text>
          </Text>
          <View style={Platform.OS === 'web' ? styles.inputWrapper : undefined}>
            <TextInput
              style={[styles.glassInput, { fontStyle: 'italic', minHeight: 60 }]}
              placeholder="any extra context to jog your memory…"
              placeholderTextColor={COLOURS.textMuted}
              selectionColor={COLOURS.coffee2}
              value={context}
              onChangeText={setContext}
              multiline
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              {isEditing ? (
                <Text style={styles.submitText}>Save changes</Text>
              ) : (
                <Text style={styles.submitText}>
                  I promise, 🐻{' '}
                  <Text style={styles.submitTextItalic}>with me!</Text>
                </Text>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay:     { flex: 1, justifyContent: 'flex-end' },
  dismissArea: { flex: 1 },
  titleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 24,
  },
  title: {
    fontFamily: FONTS.headingItalic, fontSize: SIZES.screenTitle,
    color: COLOURS.text, flex: 1,
  },
  label: {
    fontFamily: FONTS.bodyBold, fontSize: SIZES.label,
    letterSpacing: 0.8, textTransform: 'uppercase', color: COLOURS.text,
    marginBottom: 10, marginTop: 6,
  },
  labelOptional: {
    fontFamily: FONTS.body, fontSize: SIZES.label,
    textTransform: 'none', letterSpacing: 0, color: COLOURS.textMuted,
  },
  glassInput: {
    backgroundColor: GLASS_BG, borderRadius: 16,
    padding: 14, fontFamily: FONTS.body, fontSize: SIZES.body,
    color: COLOURS.text,
    marginBottom: Platform.OS === 'web' ? 0 : 18,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { minHeight: 44, maxHeight: 120 } : {}),
    ...inputShadow,
  },
  flameRow:   { flexDirection: 'row', alignItems: 'center', gap: 0, marginBottom: 0 },
  flamePip:   { padding: Platform.OS === 'web' ? 2 : 4 },
  flameEmoji: { fontSize: Platform.OS === 'web' ? 22 : 26, lineHeight: Platform.OS === 'web' ? 28 : 30 },
  flameFaded: { opacity: 0.22 },

  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  chip: {
    paddingVertical: 10, paddingHorizontal: 18,
    backgroundColor: CHIP_BG, borderRadius: RADIUS.pill,
    ...chipShadow,
  },
  chipActive:     { backgroundColor: CHIP_ACTIVE_BG },
  chipText:       { fontFamily: FONTS.bodyBold, fontSize: SIZES.bodySmall, color: COLOURS.text },
  chipTextActive: { color: COLOURS.coffee1 },

  whoInput: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 16,
    backgroundColor: CHIP_BG, borderRadius: RADIUS.pill,
    fontFamily: FONTS.body, fontSize: SIZES.bodySmall, color: COLOURS.text,
    overflow: 'hidden',
    ...chipShadow,
  },

  whenRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  whenChip: {
    flex: 1, paddingVertical: 11, alignItems: 'center',
    backgroundColor: CHIP_BG, borderRadius: RADIUS.pill,
    ...chipShadow,
  },
  whenChipText: { fontFamily: FONTS.bodyBold, fontSize: SIZES.bodySmall, color: COLOURS.text },

  // Date label row — shown after picking "specific"
  dateLabelRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: CHIP_ACTIVE_BG, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 18, marginBottom: 8,
    borderWidth: 1, borderColor: COLOURS.coffee2,
    ...chipShadow,
  },
  dateLabelText: { fontFamily: FONTS.bodyBold, fontSize: SIZES.body, color: COLOURS.coffee1 },
  dateLabelEdit: { fontFamily: FONTS.bodyBold, fontSize: SIZES.bodySmall, color: COLOURS.coffee1, opacity: 0.7 },
  webDateWrapper: { marginBottom: 8, width: '100%', overflow: 'hidden', borderRadius: 14 },
  inputWrapper:    { overflow: 'hidden', borderRadius: 16, marginBottom: 18 },
  whoInputWrapper: { overflow: 'hidden', borderRadius: RADIUS.pill },

  actions: { flexDirection: 'row', gap: 10, marginTop: 6, marginBottom: 4 },
  cancelBtn: {
    paddingVertical: 16, paddingHorizontal: 24,
    backgroundColor: CHIP_BG, borderRadius: 20,
    ...chipShadow,
  },
  cancelText: { fontFamily: FONTS.bodyBold, fontSize: SIZES.bodySmall, color: COLOURS.textMuted },
  submitBtn: {
    flex: 1, paddingVertical: 16,
    backgroundColor: CHIP_BG, borderRadius: 20, alignItems: 'center',
    shadowColor: '#6F4E37', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22, shadowRadius: 18, elevation: 8,
  },
  submitText:       { fontFamily: FONTS.bodyBold, fontSize: SIZES.body, color: COLOURS.coffee1 },
  submitTextItalic: { fontFamily: FONTS.headingItalic, fontSize: SIZES.body, color: COLOURS.coffee1 },
});
