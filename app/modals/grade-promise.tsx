import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  PanResponder, GestureResponderEvent,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePromises } from '../../storage/PromisesContext';
import { COLOURS } from '../../theme/colours';
import { FONTS, SIZES, RADIUS } from '../../theme/typography';
import {
  MODAL_GLASS_BG as GLASS_BG,
  MODAL_CHIP_BG as CHIP_BG,
  MODAL_CHIP_SHADOW as chipShadow,
  MODAL_SHEET,
  MODAL_HANDLE,
} from '../../theme/modal';

// ── LikertBar — tap or drag to set 1–5 ────────────────────────────────────
function LikertBar({
  value,
  onChange,
  filledEmoji,
  emptyEmoji,
}: {
  value:       number;
  onChange:    (v: number) => void;
  filledEmoji: string;
  emptyEmoji?: string;   // if omitted, uses filledEmoji with reduced opacity
}) {
  const rowRef = useRef<View>(null);
  const rowX   = useRef(0);
  const rowW   = useRef(0);

  const getScore = (pageX: number): number => {
    const rel = Math.max(0, Math.min(1, (pageX - rowX.current) / rowW.current));
    return Math.min(5, Math.max(1, Math.ceil(rel * 5)));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (e: GestureResponderEvent) => onChange(getScore(e.nativeEvent.pageX)),
      onPanResponderMove:  (e: GestureResponderEvent) => onChange(getScore(e.nativeEvent.pageX)),
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
      style={styles.pipsRow}
    >
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity
          key={n}
          style={styles.pipBtn}
          onPress={() => onChange(n)}
          activeOpacity={0.7}
        >
          {emptyEmoji ? (
            <Text style={styles.pip}>
              {n <= value ? filledEmoji : emptyEmoji}
            </Text>
          ) : (
            <Text style={[styles.pip, n > value && styles.pipFaded]}>
              {filledEmoji}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────
export default function GradePromiseModal() {
  const router  = useRouter();
  const { id }  = useLocalSearchParams<{ id: string }>();
  const insets  = useSafeAreaInsets();
  const { promises, updatePromise } = usePromises();
  const promise = promises.find(p => p.id === id);

  const [bearScore,  setBearScore]  = useState(0);
  const [heartScore, setHeartScore] = useState(0);
  const [reflection, setReflection] = useState('');
  const [celebrated, setCelebrated] = useState(false);

  if (!promise) return null;

  const handleKeep = async () => {
    await updatePromise({
      ...promise,
      status:       'kept',
      keptAt:       new Date().toISOString(),
      scoreHowWell: bearScore,
      scoreHowFelt: heartScore,
      reflection:   reflection.trim() || undefined,
    });
    setCelebrated(true);
  };

  // ── Celebration ──────────────────────────────────────────────────────────
  if (celebrated) {
    return (
      <View style={styles.celebrate}>
        <Text style={styles.celebrateBear}>🐻</Text>
        <Text style={styles.celebrateConfetti}>🎉 ✨ 🎊</Text>
        <Text style={styles.celebrateTitle}>Promise kept!</Text>
        <Text style={styles.celebrateSub}>
          You said you would, and you did.{'\n'}That matters.
        </Text>
        <View style={styles.celebrateScores}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>how well</Text>
            <View style={styles.scorePips}>
              {[1,2,3,4,5].map(n => (
                <Text key={n} style={[styles.scorePip, n > bearScore && styles.pipFaded]}>🐻</Text>
              ))}
            </View>
          </View>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>how it felt</Text>
            <View style={styles.scorePips}>
              {[1,2,3,4,5].map(n => (
                <Text key={n} style={styles.scorePip}>
                  {n <= heartScore ? '❤️' : <Text style={styles.pipFaded}>🤍</Text>}
                </Text>
              ))}
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.homeBtn} onPress={() => router.back()}>
          <Text style={styles.homeBtnText}>Back home 🏠</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Grading sheet ─────────────────────────────────────────────────────────
  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={() => router.back()} />

      <BlurView intensity={60} tint="light" style={[MODAL_SHEET, { paddingBottom: insets.bottom + 20 }]}>
        <View style={MODAL_HANDLE} />
        <Text style={styles.title}>How did it go?</Text>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Recap */}
          <View style={styles.recap}>
            <Text style={styles.recapLabel}>✅ marking as kept</Text>
            <Text style={styles.recapTitle}>{promise.text}</Text>
          </View>

          {/* Bears — how well */}
          <Text style={styles.label}>How well did you keep it?</Text>
          <View style={styles.scaleBlock}>
            <LikertBar value={bearScore} onChange={setBearScore} filledEmoji="🐻" />
            <View style={styles.hints}>
              <Text style={styles.hint}>barely</Text>
              <Text style={styles.hint}>fully</Text>
            </View>
          </View>

          {/* Hearts — how it felt */}
          <Text style={styles.label}>How did it feel?</Text>
          <View style={styles.scaleBlock}>
            <LikertBar
              value={heartScore}
              onChange={setHeartScore}
              filledEmoji="❤️"
              emptyEmoji="🤍"
            />
            <View style={styles.hints}>
              <Text style={styles.hint}>relieved</Text>
              <Text style={styles.hint}>proud</Text>
            </View>
          </View>

          {/* Reflection */}
          <Text style={styles.label}>
            Reflection{'  '}<Text style={styles.labelOptional}>optional</Text>
          </Text>
          <TextInput
            style={[styles.glassInput, { fontStyle: 'italic', minHeight: 64 }]}
            placeholder="how did it go?…"
            placeholderTextColor={COLOURS.textMuted}
            selectionColor={COLOURS.coffee2}
            value={reflection}
            onChangeText={setReflection}
            multiline
          />

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.keepBtn} onPress={handleKeep}>
              <Text style={styles.keepText}>
                🐻 <Text style={styles.keepTextItalic}>Keep it!</Text>
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </BlurView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay:     { flex: 1, justifyContent: 'flex-end' },
  dismissArea: { flex: 1 },
  title: {
    fontFamily: FONTS.headingItalic, fontSize: SIZES.screenTitle,
    color: COLOURS.text, marginBottom: 20,
  },

  recap: {
    backgroundColor: GLASS_BG, borderRadius: RADIUS.card,
    padding: 14, marginBottom: 22,
    borderLeftWidth: 5, borderLeftColor: COLOURS.done,
    shadowColor: '#6F4E37', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10, shadowRadius: 8, elevation: 3,
  },
  recapLabel: {
    fontFamily: FONTS.bodyBold, fontSize: SIZES.label,
    letterSpacing: 0.9, textTransform: 'uppercase',
    color: COLOURS.done, marginBottom: 6,
  },
  recapTitle: {
    fontFamily: FONTS.body, fontSize: SIZES.body,
    fontWeight: '500', color: COLOURS.text, lineHeight: 26,
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

  scaleBlock: { marginBottom: 20 },
  pipsRow:    { flexDirection: 'row', justifyContent: 'space-between' },
  pipBtn:     { flex: 1, alignItems: 'center', paddingVertical: 8 },
  pip:        { fontSize: SIZES.emoji, lineHeight: SIZES.emoji + 8 },
  pipFaded:   { opacity: 0.22 },
  hints: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 4, paddingHorizontal: 4,
  },
  hint: { fontFamily: FONTS.body, fontSize: SIZES.label, color: COLOURS.textDim },

  glassInput: {
    backgroundColor: GLASS_BG, borderRadius: 16,
    padding: 14, fontFamily: FONTS.body, fontSize: SIZES.body,
    color: COLOURS.text, marginBottom: 18,
    shadowColor: '#6F4E37', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10, shadowRadius: 8, elevation: 3,
  },

  actions: { flexDirection: 'row', gap: 10, marginTop: 6, marginBottom: 4 },
  cancelBtn: {
    paddingVertical: 16, paddingHorizontal: 24,
    backgroundColor: CHIP_BG, borderRadius: 20, ...chipShadow,
  },
  cancelText:     { fontFamily: FONTS.bodyBold, fontSize: SIZES.bodySmall, color: COLOURS.textMuted },
  keepBtn: {
    flex: 1, paddingVertical: 16,
    backgroundColor: CHIP_BG, borderRadius: 20, alignItems: 'center',
    shadowColor: '#6F4E37', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22, shadowRadius: 18, elevation: 8,
  },
  keepText:       { fontFamily: FONTS.bodyBold, fontSize: SIZES.body, color: COLOURS.done },
  keepTextItalic: { fontFamily: FONTS.headingItalic, fontSize: SIZES.body, color: COLOURS.done },

  celebrate: {
    flex: 1, backgroundColor: COLOURS.bg,
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  celebrateBear:     { fontSize: 110, marginBottom: 8 },
  celebrateConfetti: { fontSize: 30, letterSpacing: 4, marginBottom: 20 },
  celebrateTitle: {
    fontFamily: FONTS.headingItalic, fontSize: SIZES.screenTitle,
    color: COLOURS.text, marginBottom: 8,
  },
  celebrateSub: {
    fontFamily: FONTS.body, fontSize: SIZES.body,
    color: COLOURS.textMuted, textAlign: 'center', lineHeight: 26,
    marginBottom: 28, maxWidth: 280,
  },
  celebrateScores: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  scoreCard: {
    backgroundColor: GLASS_BG, borderWidth: 1, borderColor: COLOURS.glassBorder,
    borderRadius: RADIUS.card, padding: 16, alignItems: 'center', gap: 8,
    shadowColor: '#6F4E37', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10, shadowRadius: 8, elevation: 3,
  },
  scoreLabel: {
    fontFamily: FONTS.bodyBold, fontSize: SIZES.label,
    letterSpacing: 0.8, textTransform: 'uppercase', color: COLOURS.textMuted,
  },
  scorePips: { flexDirection: 'row', gap: 2 },
  scorePip:  { fontSize: SIZES.body },
  homeBtn: {
    paddingVertical: 16, paddingHorizontal: 40,
    backgroundColor: CHIP_BG, borderRadius: 20, ...chipShadow,
  },
  homeBtnText: { fontFamily: FONTS.bodyBold, fontSize: SIZES.body, color: COLOURS.coffee1 },
});
