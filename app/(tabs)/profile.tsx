import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLOURS } from '../../theme/colours';
import { FONTS, SIZES, RADIUS } from '../../theme/typography';

const YEAR = new Date().getFullYear();
const LICENCE_TEXT = `Licensed under the MIT Licence\nCopyright \u00a9 ${YEAR} Lucas Fran\u00e7a\nOpen source, free to use and modify.`;
const VERSION = '0.1.0';

const GLASS_BG = 'rgba(255,255,255,0.72)';
const BEAR_TAPS_REQUIRED = 7;

export default function ProfileScreen() {
  const [bearTaps,  setBearTaps]  = useState(0);
  const [easterEgg, setEasterEgg] = useState(false);

  const handleBearTap = () => {
    const next = bearTaps + 1;
    setBearTaps(next);
    if (next >= BEAR_TAPS_REQUIRED) { setEasterEgg(true); setBearTaps(0); }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <TouchableOpacity onPress={handleBearTap} activeOpacity={0.8}>
            <Text style={styles.heroBear}>🐻</Text>
          </TouchableOpacity>
          {bearTaps > 0 && bearTaps < BEAR_TAPS_REQUIRED && (
            <Text style={styles.easterProgress}>{BEAR_TAPS_REQUIRED - bearTaps} more…</Text>
          )}
          {easterEgg && (
            <View style={styles.easterCard}>
              <Text style={styles.easterTitle}>You found it 🎉</Text>
              <Text style={styles.easterBody}>
                This app was built during a sleepless night by someone who kept forgetting promises — not out of carelessness, but because the executive function just wasn't there.{'\n\n'}
                If you're neurodiverse or just someone who cares deeply and struggles to follow through — this bear is for you.{'\n\n'}
                You said you would. That already counts. 🐻
              </Text>
              <TouchableOpacity onPress={() => setEasterEgg(false)}>
                <Text style={styles.easterClose}>close ✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.heroTitle}>Bear with Me</Text>
          <Text style={styles.heroSub}>v{VERSION}</Text>
        </View>

        {/* Why this app */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Why this exists</Text>
          <Text style={styles.cardBody}>
            Keeping promises is hard when your brain works differently. Bear with Me is a quiet, low-pressure space to log what you've committed to, track how it felt to follow through, and build a little trust with yourself — one promise at a time.
          </Text>
        </View>

        {/* How it works */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>How it works</Text>
          {[
            ['📝', 'Log a promise', 'Add what you committed to, who you told, and how urgent it feels.'],
            ['🔥', 'Set urgency', 'Drag the flame bar — from a gentle nudge to a genuine deadline.'],
            ['✓', 'Mark it done', 'When you follow through, grade it with bears and hearts.'],
            ['🐻', 'Be honest', 'No streaks, no shame. Just a record of trying.'],
          ].map(([icon, title, body]) => (
            <View key={title} style={styles.howRow}>
              <Text style={styles.howIcon}>{icon}</Text>
              <View style={styles.howText}>
                <Text style={styles.howTitle}>{title}</Text>
                <Text style={styles.howBody}>{body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* The grading scales */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>The scales</Text>
          <View style={styles.scaleRow}>
            <View style={styles.scaleItem}>
              <Text style={styles.scaleEmoji}>🐻🐻🐻🐻🐻</Text>
              <Text style={styles.scaleTitle}>How well</Text>
              <Text style={styles.scaleBody}>Did you keep the promise as intended?</Text>
            </View>
            <View style={styles.scaleDivider} />
            <View style={styles.scaleItem}>
              <Text style={styles.scaleEmoji}>❤️❤️❤️❤️❤️</Text>
              <Text style={styles.scaleTitle}>How it felt</Text>
              <Text style={styles.scaleBody}>Did following through feel good?</Text>
            </View>
          </View>
        </View>

        {/* Built with */}
        <View style={styles.card}>
          <Text style={styles.builtWith}>Made with ❤️ and 🐻</Text>
          <View style={styles.divider} />
          <View style={styles.licenceBlock}>
            <View style={styles.licenceBadge}>
              <Text style={styles.licenceBadgeText}>MIT</Text>
            </View>
            <Text style={styles.licenceText}>{LICENCE_TEXT}</Text>
          </View>
          <TouchableOpacity style={styles.builtLinkRow} onPress={() => Linking.openURL('https://lfranca.uk')}>
            <Text style={styles.builtLink}>lfranca.uk</Text>
          </TouchableOpacity>
        </View>

        {/* Hint */}
        <Text style={styles.hint}>Tap the bear a few times for a surprise 🐾</Text>
        <View style={styles.bottomPad} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLOURS.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 12 },

  hero: { alignItems: 'center', paddingVertical: 28, gap: 4 },
  heroBear:  { fontSize: 80 },
  heroTitle: { fontFamily: FONTS.headingItalic, fontSize: SIZES.screenTitle, color: COLOURS.text, marginTop: 8 },
  heroSub:   { fontFamily: FONTS.body, fontSize: SIZES.label, color: COLOURS.textDim, letterSpacing: 1 },
  easterProgress: { fontFamily: FONTS.body, fontSize: SIZES.label, color: COLOURS.textDim, marginTop: 4 },

  easterCard: {
    backgroundColor: GLASS_BG, borderRadius: RADIUS.card,
    padding: 18, marginTop: 12, marginBottom: 4,
    borderLeftWidth: 5, borderLeftColor: COLOURS.coffee3,
    shadowColor: '#6F4E37', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 3, width: '100%',
  },
  easterTitle: { fontFamily: FONTS.heading, fontSize: SIZES.cardTitle, color: COLOURS.text, marginBottom: 10 },
  easterBody:  { fontFamily: FONTS.body, fontSize: SIZES.bodySmall, color: COLOURS.textMuted, lineHeight: 24 },
  easterClose: { fontFamily: FONTS.body, fontSize: SIZES.label, color: COLOURS.textDim, marginTop: 14, textAlign: 'right' },

  card: {
    backgroundColor: GLASS_BG, borderRadius: RADIUS.card,
    padding: 18, marginBottom: 14,
    shadowColor: '#6F4E37', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10, shadowRadius: 8, elevation: 3,
  },
  cardLabel: {
    fontFamily: FONTS.bodyBold, fontSize: SIZES.label,
    letterSpacing: 0.9, textTransform: 'uppercase',
    color: COLOURS.coffee2, marginBottom: 10,
  },
  cardBody: {
    fontFamily: FONTS.body, fontSize: SIZES.bodySmall,
    color: COLOURS.textMuted, lineHeight: 24, textAlign: 'justify',
  },

  howRow:   { flexDirection: 'row', gap: 14, marginBottom: 14, alignItems: 'flex-start' },
  howIcon:  { fontSize: 22, width: 28, textAlign: 'center', marginTop: 1 },
  howText:  { flex: 1 },
  howTitle: { fontFamily: FONTS.bodyBold, fontSize: SIZES.bodySmall, color: COLOURS.text, marginBottom: 2 },
  howBody:  { fontFamily: FONTS.body, fontSize: SIZES.label, color: COLOURS.textMuted, lineHeight: 20 },

  scaleRow:     { flexDirection: 'row', gap: 12 },
  scaleItem:    { flex: 1, alignItems: 'center', gap: 6 },
  scaleDivider: { width: 1, backgroundColor: COLOURS.glassBorder },
  scaleEmoji:   { fontSize: 13, letterSpacing: -1 },
  scaleTitle:   { fontFamily: FONTS.bodyBold, fontSize: SIZES.label, color: COLOURS.text },
  scaleBody:    { fontFamily: FONTS.body, fontSize: SIZES.label, color: COLOURS.textMuted, textAlign: 'center', lineHeight: 18 },

  builtWith:    { fontFamily: FONTS.bodyBold, fontSize: SIZES.body, color: COLOURS.text, textAlign: 'center', marginBottom: 14 },
  divider:      { height: 1, backgroundColor: COLOURS.glassBorder, marginBottom: 14 },
  licenceBlock: { alignItems: 'center', gap: 8, marginBottom: 4 },
  licenceBadge: { paddingVertical: 3, paddingHorizontal: 8, backgroundColor: COLOURS.coffee1, borderRadius: 6 },
  licenceBadgeText: { fontFamily: FONTS.bodyBold, fontSize: 11, color: '#fff', letterSpacing: 0.5 },
  licenceText:  { fontFamily: FONTS.body, fontSize: SIZES.label, color: COLOURS.textMuted, lineHeight: 18, textAlign: 'center' },
  builtLinkRow: { alignItems: 'center', marginTop: 14 },
  builtLink:    { fontFamily: FONTS.body, fontSize: SIZES.bodySmall, color: COLOURS.coffee1, textDecorationLine: 'underline' },

  hint:      { fontFamily: FONTS.bodyItalic, fontSize: SIZES.label, color: COLOURS.textDim, textAlign: 'center', marginBottom: 8 },
  bottomPad: { height: 100 },
});
