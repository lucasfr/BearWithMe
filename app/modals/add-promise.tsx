import { useState, useRef, useCallback, useMemo } from 'react';
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
        <Text style={styles.title}>
          {isEditing ? 'Edit promise' : 'I promise to…'}
        </Text>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <Text style={styles.label}>The promise</Text>
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

          <Text style={styles.label}>Urgency</Text>
          <FlameBar value={urgency} onChange={setUrgency} />

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
            <TextInput
              style={styles.whoInput}
              placeholder="someone else…"
              placeholderTextColor={COLOURS.textMuted}
              selectionColor={COLOURS.coffee2}
              value={customWho}
              onChangeText={v => { setCustomWho(v); if (v) setToWhom(''); }}
            />
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
                {/* @ts-ignore */}
                <input
                  type="date"
                  value={isoDate(specificDate)}
                  onChange={(e: any) => {
                    if (e.target.value) setSpecificDate(new Date(e.target.value + 'T12:00:00'));
                  }}
                  style={{
                    width: '100%', padding: '14px 18px',
                    fontFamily: 'inherit', fontSize: '17px',
                    fontWeight: '600',
                    color: '#6F4E37',
                    backgroundColor: 'rgba(166,123,91,0.15)',
                    border: '1.5px solid rgba(166,123,91,0.40)',
                    borderRadius: '14px',
                    outline: 'none',
                    accentColor: '#6F4E37',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
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
          <TextInput
            style={[styles.glassInput, { fontStyle: 'italic', minHeight: 60 }]}
            placeholder="any extra context to jog your memory…"
            placeholderTextColor={COLOURS.textMuted}
            selectionColor={COLOURS.coffee2}
            value={context}
            onChangeText={setContext}
            multiline
          />

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
  title: {
    fontFamily: FONTS.headingItalic, fontSize: SIZES.screenTitle,
    color: COLOURS.text, marginBottom: 24,
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
    color: COLOURS.text, marginBottom: 18,
    ...inputShadow,
  },
  flameRow:   { flexDirection: 'row', justifyContent: 'center', gap: 4, marginBottom: 18 },
  flamePip:   { padding: 8 },
  flameEmoji: { fontSize: SIZES.emoji, lineHeight: SIZES.emoji + 8 },
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
  webDateWrapper: { marginBottom: 8, width: '100%' },

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
