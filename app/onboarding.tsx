import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Rect, Defs, Pattern } from 'react-native-svg';
import { COLOURS } from '../theme/colours';
import { FONTS, SIZES, RADIUS } from '../theme/typography';
import { MODAL_CHIP_BG, MODAL_CHIP_SHADOW } from '../theme/modal';

const { width: W } = Dimensions.get('window');
const NAME_KEY = '@bwm:userName';

const SLIDES = [
  {
    emoji: '🐻',
    title: 'Bear with Me',
    body: 'Keeping promises is hard when your brain works differently. This is a quiet, low-pressure space to log what you\'ve committed to, track how it felt to follow through, and build a little trust with yourself — one promise at a time.',
  },
  {
    emoji: '📝',
    title: 'Log a promise',
    body: 'Add what you committed to, who you told, and how urgent it feels. You can set a rough deadline — no rush, this week, this month — or pin it to a specific date.',
  },
  {
    emoji: '🔥',
    title: 'Set urgency',
    body: 'Drag the flame bar to show how urgent it feels. One flame for a gentle nudge. Three for a genuine deadline. No judgement either way.',
  },
  {
    emoji: '✅',
    title: 'Mark it done',
    body: 'When you follow through, grade it on two simple scales:\n\n🐻  How well did you keep it?\n❤️  How did it feel to follow through?\n\nBoth matter. Neither is required.',
  },
  {
    emoji: '🐾',
    title: 'No streaks.\nNo shame.',
    body: 'Bear with Me doesn\'t track streaks or scores. It\'s not a productivity app. It\'s a record of trying.\n\nYou said you would. That already counts.',
  },
];

interface OnboardingProps {
  onDone: () => void;
}

export default function Onboarding({ onDone }: OnboardingProps) {
  const [page, setPage] = useState(0);
  const [name, setName] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const totalPages = SLIDES.length + 1; // slides + name screen
  const isNameScreen = page === SLIDES.length;
  const isLast = page === totalPages - 1;

  const goTo = (index: number) => {
    setPage(index);
    scrollRef.current?.scrollTo({ x: index * W, animated: true });
  };

  const next = async () => {
    if (!isLast) {
      goTo(page + 1);
    } else {
      // Save name if provided then finish
      if (name.trim()) {
        await AsyncStorage.setItem(NAME_KEY, name.trim());
      }
      onDone();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >

      {/* Dot grid */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <Pattern id="obdots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <Circle cx="1" cy="1" r="1" fill="rgba(111,78,55,0.18)" />
            </Pattern>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#obdots)" />
        </Svg>
      </View>

      {/* Skip */}
      {page < SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skip} onPress={onDone} activeOpacity={0.7}>
          <Text style={styles.skipText}>skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      >
        {/* Content slides */}
        {SLIDES.map((slide, i) => (
          <View key={i} style={styles.slide}>
            <Text style={styles.emoji}>{slide.emoji}</Text>
            <Text style={styles.title}>{slide.title}</Text>
            <View style={styles.card}>
              <Text style={styles.body}>{slide.body}</Text>
            </View>
          </View>
        ))}

        {/* Name screen */}
        <View style={styles.slide}>
          <Text style={styles.emoji}>👋</Text>
          <Text style={styles.title}>What should I call you?</Text>
          <View style={styles.card}>
            <Text style={styles.nameHint}>
              This is just for your greeting on the home screen. You can change it any time in your profile.
            </Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Your name…"
              placeholderTextColor={COLOURS.textDim}
              selectionColor={COLOURS.coffee2}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={next}
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom */}
      <View style={styles.bottom}>

        {/* Dot indicators */}
        <View style={styles.dots}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.7}>
              <View style={[styles.dot, i === page && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity style={styles.btn} onPress={next} activeOpacity={0.85}>
          <Text style={styles.btnText}>
            {isLast
              ? (name.trim() ? `Let's go, ${name.trim()} 🐻` : 'Let\'s go 🐻')
              : page === SLIDES.length - 1 ? 'Almost there →'
              : 'Next →'}
          </Text>
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLOURS.bg,
  },

  skip: {
    position: 'absolute', top: 60, right: 24, zIndex: 10,
    paddingVertical: 8, paddingHorizontal: 16,
    backgroundColor: MODAL_CHIP_BG,
    borderRadius: RADIUS.pill,
    ...MODAL_CHIP_SHADOW,
  },
  skipText: {
    fontFamily: FONTS.body, fontSize: SIZES.label,
    color: COLOURS.textMuted,
  },

  slide: {
    width: W,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
    paddingBottom: 40,
    gap: 20,
  },

  emoji: {
    fontSize: 80,
    lineHeight: 92,
  },

  title: {
    fontFamily: FONTS.headingItalic,
    fontSize: SIZES.screenTitle,
    color: COLOURS.text,
    textAlign: 'center',
    lineHeight: 38,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.80)',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.90)',
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
    width: '100%',
    gap: 16,
  },

  body: {
    fontFamily: FONTS.body,
    fontSize: SIZES.body,
    color: COLOURS.textMuted,
    lineHeight: 28,
    textAlign: 'center',
  },

  // Name screen
  nameHint: {
    fontFamily: FONTS.body,
    fontSize: SIZES.bodySmall,
    color: COLOURS.textMuted,
    lineHeight: 24,
    textAlign: 'center',
  },
  nameInput: {
    width: '100%',
    fontFamily: FONTS.headingItalic,
    fontSize: SIZES.cardTitle,
    color: COLOURS.text,
    borderBottomWidth: 2,
    borderBottomColor: COLOURS.coffee2,
    paddingVertical: 8,
    textAlign: 'center',
  },

  bottom: {
    paddingHorizontal: 32,
    paddingBottom: 64,
    gap: 24,
    alignItems: 'center',
  },

  dots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(111,78,55,0.20)',
  },
  dotActive: {
    width: 24,
    backgroundColor: COLOURS.coffee1,
  },

  btn: {
    alignSelf: 'stretch',
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: MODAL_CHIP_BG,
    borderRadius: 20,
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
  btnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: SIZES.body,
    color: COLOURS.coffee1,
  },
});
