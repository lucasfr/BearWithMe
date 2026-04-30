import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, PanResponder, GestureResponderEvent,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePromises } from '../../storage/PromisesContext';
import { generateId } from '../../utils/promise';
import { Promise, UrgencyLevel, FuzzyDeadline } from '../../types/promise';
import { COLOURS } from '../../theme/colours';
import { FONTS, SIZES, RADIUS } from '../../theme/typography';

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
  const router = useRouter();
  const { addPromise } = usePromises();
  const insets = useSafeAreaInsets();

  const [text, setText]                 = useState('');
  const [urgency, setUrgency]           = useState<UrgencyLevel>(1);
  const [toWhom, setToWhom]             = useState('');
  const [customWho, setCustomWho]       = useState('');
  const [fuzzy, setFuzzy]               = useState<FuzzyDeadline>('this-week');
  const [specificDate, setSpecificDate] = useState('');
  const [showDate, setShowDate]         = useState(false);
  const [context, setContext]           = useState('');

  const handleSubmit = async () => {
    if (!text.trim()) return;
    const who = toWhom || customWho.trim() || 'myself';
    const p: Promise = {
      id: generateId(),
      text: text.trim(),
      urgency,
      toWhom: who,
      fuzzyDeadline: showDate ? 'specific' : fuzzy,
      specificDate: showDate ? specificDate : undefined,
      context: context.trim() || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await addPromise(p);
    router.back();
  };

  const WHEN_OPTIONS: { key: FuzzyDeadline; label: string }[] = [
    { key: 'none',       label: 'no rush'    },
    { key: 'this-week',  label: 'this week'  },
    { key: 'this-month', label: 'this month' },
    { key: 'specific',   label: 'specific'   },
  ];

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={() => router.back()} />

      <BlurView
        intensity={60}
        tint="light"
        style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}
      >
        <View style={styles.handle} />
        <Text style={styles.title}>I promise to…</Text>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <Text style={styles.label}>The promise</Text>
          <TextInput
            style={[styles.glassInput, { minHeight: 60 }]}
            placeholder="describe what you promised…"
            placeholderTextColor={COLOURS.textDim}
            selectionColor={COLOURS.coffee2}
            value={text}
            onChangeText={setText}
            multiline
          />

          <Text style={styles.label}>Urgency</Text>
          <FlameBar value={urgency} onChange={setUrgency} />

          <Text style={styles.label}>To whom</Text>
          <View style={styles.chipRow}>
            {['myself', 'team'].map(w => (
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
              placeholderTextColor={COLOURS.textDim}
              selectionColor={COLOURS.coffee2}
              value={customWho}
              onChangeText={v => { setCustomWho(v); if (v) setToWhom(''); }}
            />
          </View>

          <Text style={styles.label}>When</Text>
          <View style={styles.whenRow}>
            {WHEN_OPTIONS.map(({ key, label }) => {
              const isActive = key === 'specific'
                ? showDate
                : (!showDate && fuzzy === key);
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.whenChip, isActive && styles.chipActive]}
                  onPress={() => {
                    if (key === 'specific') { setShowDate(s => !s); }
                    else { setFuzzy(key); setShowDate(false); }
                  }}
                >
                  <Text style={[styles.whenChipText, isActive && styles.chipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {showDate && (
            <TextInput
              style={[styles.glassInput, { marginTop: -8, marginBottom: 16 }]}
              placeholder="e.g. Fri 2 May"
              placeholderTextColor={COLOURS.textDim}
              selectionColor={COLOURS.coffee2}
              value={specificDate}
              onChangeText={setSpecificDate}
            />
          )}

          <Text style={styles.label}>
            Context{'  '}<Text style={styles.labelOptional}>optional</Text>
          </Text>
          <TextInput
            style={[styles.glassInput, { fontStyle: 'italic', minHeight: 56 }]}
            placeholder="any extra context to jog your memory…"
            placeholderTextColor={COLOURS.textDim}
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
              <Text style={styles.submitText}>
                I promise, 🐻{' '}
                <Text style={styles.submitTextItalic}>with me!</Text>
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </BlurView>
    </View>
  );
}

const GLASS_BG     = 'rgba(255,255,255,0.40)';
const GLASS_BORDER = 'rgba(255,255,255,0.60)';
const SHADOW = {
  shadowColor: 'rgba(111,78,55,1)',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 2,
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  dismissArea: { flex: 1 },

  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.60)',
    paddingHorizontal: 18, paddingTop: 12,
    maxHeight: '92%',
    overflow: 'hidden',
  },

  handle: {
    width: 36, height: 4, backgroundColor: 'rgba(111,78,55,0.22)',
    borderRadius: 99, alignSelf: 'center', marginBottom: 18,
  },
  title: {
    fontFamily: FONTS.headingItalic, fontSize: 22,
    color: COLOURS.text, marginBottom: 20,
  },
  label: {
    fontFamily: FONTS.body, fontSize: SIZES.label, fontWeight: '700',
    letterSpacing: 0.9, textTransform: 'uppercase', color: COLOURS.coffee2,
    marginBottom: 8, marginTop: 2,
  },
  labelOptional: {
    fontFamily: FONTS.body, fontSize: 11, fontWeight: '400',
    textTransform: 'none', letterSpacing: 0, color: COLOURS.textDim,
  },
  glassInput: {
    backgroundColor: GLASS_BG, borderWidth: 1, borderColor: GLASS_BORDER,
    borderRadius: RADIUS.card, padding: 13, fontFamily: FONTS.body, fontSize: 16,
    color: COLOURS.text, marginBottom: 16, ...SHADOW,
  },
  flameRow: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginBottom: 16 },
  flamePip: { padding: 6 },
  flameEmoji: { fontSize: 36, lineHeight: 42 },
  flameFaded: { opacity: 0.22 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingVertical: 9, paddingHorizontal: 16,
    backgroundColor: GLASS_BG, borderWidth: 1, borderColor: GLASS_BORDER,
    borderRadius: RADIUS.pill, ...SHADOW,
  },
  chipActive: { backgroundColor: COLOURS.coffee1, borderColor: COLOURS.coffee1 },
  chipText: { fontFamily: FONTS.body, fontSize: 14, fontWeight: '600', color: COLOURS.textMuted },
  chipTextActive: { color: '#fff' },
  whoInput: {
    flex: 1, minWidth: 100, paddingVertical: 9, paddingHorizontal: 14,
    backgroundColor: GLASS_BG, borderWidth: 1, borderColor: GLASS_BORDER,
    borderRadius: RADIUS.pill, fontFamily: FONTS.body, fontSize: 14, color: COLOURS.text,
  },
  whenRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  whenChip: {
    flex: 1, paddingVertical: 9, alignItems: 'center',
    backgroundColor: GLASS_BG, borderWidth: 1, borderColor: GLASS_BORDER,
    borderRadius: RADIUS.pill, ...SHADOW,
  },
  whenChipText: { fontFamily: FONTS.body, fontSize: 12, fontWeight: '600', color: COLOURS.textMuted },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 4 },
  cancelBtn: {
    paddingVertical: 16, paddingHorizontal: 22,
    backgroundColor: GLASS_BG, borderWidth: 1, borderColor: GLASS_BORDER,
    borderRadius: RADIUS.btn, ...SHADOW,
  },
  cancelText: { fontFamily: FONTS.body, fontSize: 15, fontWeight: '600', color: COLOURS.textMuted },
  submitBtn: {
    flex: 1, paddingVertical: 16, backgroundColor: GLASS_BG,
    borderRadius: RADIUS.btn, alignItems: 'center',
    borderWidth: 1, borderColor: GLASS_BORDER,
    shadowColor: 'rgba(111,78,55,1)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18, shadowRadius: 16, elevation: 6,
  },
  submitText: { fontFamily: FONTS.body, fontSize: 16, fontWeight: '600', color: COLOURS.coffee1 },
  submitTextItalic: { fontFamily: FONTS.headingItalic, fontSize: 16, color: COLOURS.coffee1 },
});
