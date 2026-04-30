import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { usePromises } from '../../storage/PromisesContext';
import { generateId } from '../../utils/promise';
import { Promise, UrgencyLevel, FuzzyDeadline } from '../../types/promise';
import { COLOURS, URGENCY_FLAMES } from '../../theme/colours';
import { FONTS, SIZES, RADIUS } from '../../theme/typography';

export default function AddPromiseModal() {
  const router = useRouter();
  const { addPromise } = usePromises();

  const [text, setText]                 = useState('');
  const [urgency, setUrgency]           = useState<UrgencyLevel>(1);
  const [toWhom, setToWhom]             = useState('');
  const [fuzzy, setFuzzy]               = useState<FuzzyDeadline>('this-week');
  const [specificDate, setSpecificDate] = useState('');
  const [showDate, setShowDate]         = useState(false);
  const [context, setContext]           = useState('');

  const handleSubmit = async () => {
    if (!text.trim()) return;
    const p: Promise = {
      id: generateId(),
      text: text.trim(),
      urgency,
      toWhom: toWhom.trim() || 'myself',
      fuzzyDeadline: showDate ? 'specific' : fuzzy,
      specificDate: showDate ? specificDate : undefined,
      context: context.trim() || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await addPromise(p);
    router.back();
  };

  const FUZZY_OPTIONS: { key: FuzzyDeadline; label: string }[] = [
    { key: 'none',       label: 'no rush'    },
    { key: 'this-week',  label: 'this week'  },
    { key: 'this-month', label: 'this month' },
  ];

  return (
    <View style={styles.overlay}>
      <View style={styles.drawer}>
        <View style={styles.handle} />
        <Text style={styles.drawerTitle}>I promise to…</Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>The promise</Text>
          <TextInput
            style={styles.textInput}
            placeholder="describe what you promised…"
            placeholderTextColor={COLOURS.textDim}
            value={text}
            onChangeText={setText}
            multiline
          />

          <Text style={styles.label}>Urgency</Text>
          <View style={styles.urgencyRow}>
            {([0, 1, 2, 3] as UrgencyLevel[]).map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.urgencyBtn, urgency === u && styles.urgencyBtnActive]}
                onPress={() => setUrgency(u)}
              >
                <Text style={[styles.urgencyFlame, u === 0 && styles.faded]}>
                  {URGENCY_FLAMES[u]}
                </Text>
                <Text style={styles.urgencyLabel}>
                  {['none', 'low', 'soon', 'urgent'][u]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>To whom</Text>
          <View style={styles.whoRow}>
            {['myself', 'team'].map(w => (
              <TouchableOpacity
                key={w}
                style={[styles.whoChip, toWhom === w && styles.whoChipActive]}
                onPress={() => setToWhom(prev => prev === w ? '' : w)}
              >
                <Text style={toWhom === w ? styles.whoChipTextActive : styles.whoChipText}>
                  {w === 'myself' ? '🙋 myself' : '👥 team'}
                </Text>
              </TouchableOpacity>
            ))}
            <TextInput
              style={styles.whoInput}
              placeholder="someone else…"
              placeholderTextColor={COLOURS.textDim}
              value={!['myself', 'team', ''].includes(toWhom) ? toWhom : ''}
              onChangeText={setToWhom}
            />
          </View>

          <Text style={styles.label}>When</Text>
          <View style={styles.fuzzyRow}>
            {FUZZY_OPTIONS.map(o => (
              <TouchableOpacity
                key={o.key}
                style={[styles.fuzzyBtn, !showDate && fuzzy === o.key && styles.fuzzyBtnActive]}
                onPress={() => { setFuzzy(o.key); setShowDate(false); }}
              >
                <Text style={[styles.fuzzyBtnText, !showDate && fuzzy === o.key && styles.fuzzyBtnTextActive]}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.fuzzyBtn, showDate && styles.fuzzyBtnActive]}
              onPress={() => setShowDate(s => !s)}
            >
              <Text style={[styles.fuzzyBtnText, showDate && styles.fuzzyBtnTextActive]}>
                specific date
              </Text>
            </TouchableOpacity>
          </View>
          {showDate && (
            <TextInput
              style={styles.dateInput}
              placeholder="e.g. Fri 2 May"
              placeholderTextColor={COLOURS.textDim}
              value={specificDate}
              onChangeText={setSpecificDate}
            />
          )}

          <Text style={styles.label}>
            Context{'  '}
            <Text style={styles.labelOptional}>optional</Text>
          </Text>
          <TextInput
            style={[styles.textInput, styles.contextInput]}
            placeholder="any extra context to jog your memory…"
            placeholderTextColor={COLOURS.textDim}
            value={context}
            onChangeText={setContext}
            multiline
          />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitText}>I promise, 🐻 with me!</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(44,26,14,0.38)' },
  drawer: { backgroundColor: COLOURS.drawerBg, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, paddingBottom: 36, borderTopWidth: 1, borderTopColor: COLOURS.glassBorder },
  handle: { width: 38, height: 4, backgroundColor: 'rgba(111,78,55,0.22)', borderRadius: 99, alignSelf: 'center', marginBottom: 18 },
  drawerTitle: { fontFamily: FONTS.headingItalic, fontSize: 20, color: COLOURS.text, marginBottom: 16 },
  label: { fontFamily: FONTS.body, fontSize: SIZES.label, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase', color: COLOURS.coffee2, marginBottom: 7 },
  labelOptional: { fontFamily: FONTS.body, fontSize: 11, fontWeight: '400', textTransform: 'none', letterSpacing: 0, color: COLOURS.textDim },
  textInput: { backgroundColor: 'rgba(255,255,255,0.80)', borderWidth: 1, borderColor: COLOURS.glassBorder, borderRadius: RADIUS.card, padding: 12, fontFamily: FONTS.body, fontSize: 16, color: COLOURS.text, marginBottom: 16, minHeight: 52 },
  contextInput: { fontStyle: 'italic', color: COLOURS.textMuted },
  urgencyRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  urgencyBtn: { flex: 1, padding: 10, backgroundColor: 'rgba(255,255,255,0.60)', borderWidth: 1.5, borderColor: COLOURS.glassBorder, borderRadius: RADIUS.card, alignItems: 'center', gap: 4 },
  urgencyBtnActive: { borderColor: COLOURS.coffee3, backgroundColor: 'rgba(236,177,118,0.15)' },
  urgencyFlame: { fontSize: 18 },
  faded: { opacity: 0.25 },
  urgencyLabel: { fontFamily: FONTS.body, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: COLOURS.textMuted, letterSpacing: 0.4 },
  whoRow: { flexDirection: 'row', gap: 7, marginBottom: 16, flexWrap: 'wrap' },
  whoChip: { paddingVertical: 7, paddingHorizontal: 13, backgroundColor: 'rgba(255,255,255,0.60)', borderWidth: 1.5, borderColor: COLOURS.glassBorder, borderRadius: RADIUS.pill },
  whoChipActive: { backgroundColor: COLOURS.coffee1, borderColor: COLOURS.coffee1 },
  whoChipText: { fontFamily: FONTS.body, fontSize: 14, fontWeight: '600', color: COLOURS.textMuted },
  whoChipTextActive: { fontFamily: FONTS.body, fontSize: 14, fontWeight: '600', color: '#fff' },
  whoInput: { flex: 1, minWidth: 110, paddingVertical: 7, paddingHorizontal: 13, backgroundColor: 'rgba(255,255,255,0.80)', borderWidth: 1.5, borderColor: COLOURS.glassBorder, borderRadius: RADIUS.pill, fontFamily: FONTS.body, fontSize: 14, color: COLOURS.text },
  fuzzyRow: { flexDirection: 'row', gap: 7, marginBottom: 10, flexWrap: 'wrap' },
  fuzzyBtn: { flex: 1, paddingVertical: 9, backgroundColor: 'rgba(255,255,255,0.60)', borderWidth: 1.5, borderColor: COLOURS.glassBorder, borderRadius: RADIUS.card, alignItems: 'center' },
  fuzzyBtnActive: { backgroundColor: 'rgba(166,123,91,0.12)', borderColor: COLOURS.coffee2 },
  fuzzyBtnText: { fontFamily: FONTS.body, fontSize: 13, fontWeight: '600', color: COLOURS.textMuted },
  fuzzyBtnTextActive: { color: COLOURS.coffee1 },
  dateInput: { backgroundColor: 'rgba(255,255,255,0.80)', borderWidth: 1, borderColor: COLOURS.glassBorder, borderRadius: RADIUS.small, padding: 9, fontFamily: FONTS.body, fontSize: 14, fontWeight: '600', color: COLOURS.coffee1, marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { paddingVertical: 14, paddingHorizontal: 20, backgroundColor: COLOURS.glass, borderWidth: 1, borderColor: COLOURS.glassBorder, borderRadius: RADIUS.btn },
  cancelText: { fontFamily: FONTS.body, fontSize: 15, fontWeight: '600', color: COLOURS.textMuted },
  submitBtn: { flex: 1, paddingVertical: 14, backgroundColor: COLOURS.coffee1, borderRadius: RADIUS.btn, alignItems: 'center' },
  submitText: { fontFamily: FONTS.body, fontSize: 15, fontWeight: '700', color: '#fff' },
});
