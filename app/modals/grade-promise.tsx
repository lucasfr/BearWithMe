import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usePromises } from '../../storage/PromisesContext';
import { COLOURS } from '../../theme/colours';
import { FONTS, SIZES, RADIUS } from '../../theme/typography';

export default function GradePromiseModal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
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

  if (celebrated) {
    return (
      <View style={styles.celebrate}>
        <Text style={styles.celebrateBear}>🐻</Text>
        <Text style={styles.celebrateConfetti}>🎉 ✨ 🎊</Text>
        <Text style={styles.celebrateTitle}>Promise kept!</Text>
        <Text style={styles.celebrateSub}>You said you would, and you did. That matters.</Text>
        <View style={styles.celebrateScores}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>how well</Text>
            <Text style={styles.scoreEmojis}>
              {Array.from({length:5},(_,i) => i < bearScore ? '🐻' : '🤍').join('')}
            </Text>
          </View>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>how it felt</Text>
            <Text style={styles.scoreEmojis}>
              {Array.from({length:5},(_,i) => i < heartScore ? '❤️' : '🤍').join('')}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.homeBtn} onPress={() => router.back()}>
          <Text style={styles.homeBtnText}>Back home 🏠</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.drawer}>
        <View style={styles.handle} />

        <View style={styles.recap}>
          <Text style={styles.recapLabel}>✓ marking as kept</Text>
          <Text style={styles.recapTitle}>{promise.text}</Text>
        </View>

        <Text style={styles.label}>How did it go?</Text>

        <View style={styles.scalesRow}>
          <View style={styles.scaleGroup}>
            <Text style={styles.scaleLabel}>how well</Text>
            <View style={styles.pipsRow}>
              {[1,2,3,4,5].map(n => (
                <TouchableOpacity key={n} onPress={() => setBearScore(n)}>
                  <Text style={[styles.pip, n > bearScore && styles.pipFaded]}>🐻</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.hints}>
              <Text style={styles.hint}>barely</Text>
              <Text style={styles.hint}>fully</Text>
            </View>
          </View>

          <View style={styles.dividerV} />

          <View style={styles.scaleGroup}>
            <Text style={styles.scaleLabel}>how it felt</Text>
            <View style={styles.pipsRow}>
              {[1,2,3,4,5].map(n => (
                <TouchableOpacity key={n} onPress={() => setHeartScore(n)}>
                  <Text style={[styles.pip, n > heartScore && styles.pipFaded]}>
                    {n <= heartScore ? '❤️' : '🤍'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.hints}>
              <Text style={styles.hint}>relieved</Text>
              <Text style={styles.hint}>proud</Text>
            </View>
          </View>
        </View>

        <Text style={styles.label}>
          Reflection{'  '}<Text style={styles.labelOptional}>optional</Text>
        </Text>
        <TextInput
          style={styles.reflectionInput}
          placeholder="how did it go?…"
          placeholderTextColor={COLOURS.textDim}
          value={reflection}
          onChangeText={setReflection}
          multiline
        />

        <View style={styles.actions}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keepBtn} onPress={handleKeep}>
            <Text style={styles.keepText}>🐻 Keep it!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(44,26,14,0.38)' },
  drawer: { backgroundColor: COLOURS.drawerBg, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, paddingBottom: 36, borderTopWidth: 1, borderTopColor: COLOURS.glassBorder },
  handle: { width: 38, height: 4, backgroundColor: 'rgba(111,78,55,0.22)', borderRadius: 99, alignSelf: 'center', marginBottom: 18 },
  recap: { backgroundColor: 'rgba(255,255,255,0.65)', borderWidth: 1, borderColor: COLOURS.glassBorder, borderRadius: RADIUS.card, padding: 13, marginBottom: 22, borderLeftWidth: 5, borderLeftColor: COLOURS.done },
  recapLabel: { fontFamily: FONTS.body, fontSize: SIZES.label, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase', color: COLOURS.done, marginBottom: 5 },
  recapTitle: { fontFamily: FONTS.body, fontSize: 16, fontWeight: '500', color: COLOURS.text, lineHeight: 22 },
  label: { fontFamily: FONTS.body, fontSize: SIZES.label, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase', color: COLOURS.coffee2, marginBottom: 12 },
  labelOptional: { fontFamily: FONTS.body, fontSize: 11, fontWeight: '400', textTransform: 'none', letterSpacing: 0, color: COLOURS.textDim },
  scalesRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 20, marginBottom: 24, justifyContent: 'center' },
  scaleGroup: { alignItems: 'center', gap: 8 },
  scaleLabel: { fontFamily: FONTS.body, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, color: COLOURS.coffee2 },
  pipsRow: { flexDirection: 'row', gap: 4 },
  pip: { fontSize: 28 },
  pipFaded: { opacity: 0.22 },
  hints: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  hint: { fontFamily: FONTS.body, fontSize: 10, color: COLOURS.textDim },
  dividerV: { width: 1, backgroundColor: COLOURS.glassBorder, alignSelf: 'stretch', marginTop: 20 },
  reflectionInput: { backgroundColor: 'rgba(255,255,255,0.60)', borderWidth: 1, borderColor: COLOURS.glassBorder, borderRadius: RADIUS.card, padding: 10, fontFamily: FONTS.bodyItalic, fontSize: 14, color: COLOURS.textMuted, marginBottom: 18, minHeight: 52 },
  actions: { flexDirection: 'row', gap: 10 },
  backBtn: { paddingVertical: 14, paddingHorizontal: 20, backgroundColor: COLOURS.glass, borderWidth: 1, borderColor: COLOURS.glassBorder, borderRadius: RADIUS.btn },
  backText: { fontFamily: FONTS.body, fontSize: 15, fontWeight: '600', color: COLOURS.textMuted },
  keepBtn: { flex: 1, paddingVertical: 14, backgroundColor: COLOURS.done, borderRadius: RADIUS.btn, alignItems: 'center' },
  keepText: { fontFamily: FONTS.body, fontSize: 15, fontWeight: '700', color: '#fff' },
  celebrate: { flex: 1, backgroundColor: COLOURS.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  celebrateBear: { fontSize: 110, marginBottom: 8 },
  celebrateConfetti: { fontSize: 30, letterSpacing: 4, marginBottom: 20 },
  celebrateTitle: { fontFamily: FONTS.headingItalic, fontSize: 28, color: COLOURS.text, marginBottom: 8 },
  celebrateSub: { fontFamily: FONTS.body, fontSize: 15, color: COLOURS.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: 26, maxWidth: 260 },
  celebrateScores: { flexDirection: 'row', gap: 16, marginBottom: 28 },
  scoreCard: { backgroundColor: 'rgba(255,255,255,0.70)', borderWidth: 1, borderColor: COLOURS.glassBorder, borderRadius: RADIUS.card, padding: 14, alignItems: 'center', gap: 6 },
  scoreLabel: { fontFamily: FONTS.body, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: COLOURS.textMuted },
  scoreEmojis: { fontSize: 18, letterSpacing: 2 },
  homeBtn: { paddingVertical: 14, paddingHorizontal: 40, backgroundColor: COLOURS.coffee1, borderRadius: RADIUS.btn },
  homeBtnText: { fontFamily: FONTS.body, fontSize: 16, fontWeight: '700', color: '#fff' },
});
