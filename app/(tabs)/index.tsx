import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform,
} from 'react-native';
import { useCallback, useMemo } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Polyline, Path, Line, Rect, Defs, Pattern, RadialGradient, Stop } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { usePromises } from '../../storage/PromisesContext';
import { groupPromises, computeStatus } from '../../utils/promise';
import { Promise as BwmPromise } from '../../types/promise';
import { COLOURS } from '../../theme/colours';
import { FONTS, SIZES, RADIUS } from '../../theme/typography';

// ── SVG icons ─────────────────────────────────────────────────────────────
const ClockIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={COLOURS.alert} strokeWidth={2.5}>
    <Circle cx="12" cy="12" r="10" />
    <Polyline points="12 6 12 12 16 14" />
  </Svg>
);
const MetaCalendarIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={COLOURS.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <Line x1="16" y1="2" x2="16" y2="6" />
    <Line x1="8" y1="2" x2="8" y2="6" />
    <Line x1="3" y1="10" x2="21" y2="10" />
  </Svg>
);
const PersonIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={COLOURS.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);
const SearchIcon = ({ color }: { color: string }) => (
  <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="8" />
    <Path d="m21 21-4.35-4.35" />
  </Svg>
);
const EditIcon = ({ color }: { color: string }) => (
  <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 20h9" />
    <Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </Svg>
);

// ── Helpers ────────────────────────────────────────────────────────────────
function urgencyStripeColor(urgency: number, status: string): string {
  if (status === 'overdue') return COLOURS.alert;
  if (status === 'kept')    return COLOURS.done;
  if (urgency === 3) return COLOURS.alert;
  if (urgency === 2) return COLOURS.coffee3;
  if (urgency === 1) return COLOURS.coffee2;
  return COLOURS.textDim;
}
const FLAME_MAP: Record<number, string> = { 0: '🔥', 1: '🔥', 2: '🔥🔥', 3: '🔥🔥🔥' };

// ── PromiseCard ────────────────────────────────────────────────────────────
function PromiseCard({ promise, onPress }: { promise: BwmPromise; onPress: () => void }) {
  const status      = computeStatus(promise);
  const isKept      = status === 'kept';
  const stripeColor = urgencyStripeColor(promise.urgency, status);
  const flames      = FLAME_MAP[promise.urgency] ?? '🔥';
  const flameFaded  = promise.urgency === 0;

  let deadlineLabel: string | null = null;
  if (promise.specificDate) {
    const d = new Date(promise.specificDate);
    deadlineLabel = status === 'overdue'
      ? `Was due ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
      : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  } else if (promise.fuzzyDeadline === 'this-week') {
    deadlineLabel = 'This week';
  } else if (promise.fuzzyDeadline === 'this-month') {
    deadlineLabel = 'This month';
  }

  let keptLabel: string | null = null;
  if (isKept && promise.keptAt) {
    const d = new Date(promise.keptAt);
    keptLabel = `✓ Done ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
  }

  const bearScore  = promise.scoreHowWell ?? 0;
  const heartScore = promise.scoreHowFelt ?? 0;

  return (
    <TouchableOpacity style={[styles.card, isKept && styles.cardDone]} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.cardStripe, { backgroundColor: stripeColor }]} />
      <View style={styles.cardInner}>
        <View style={styles.cardTop}>
          <Text style={[styles.cardTitle, isKept && styles.cardTitleDone]} numberOfLines={2}>
            {promise.text}
          </Text>
          <Text style={[styles.cardFlames, flameFaded && styles.cardFlamesFaded]}>{flames}</Text>
        </View>

        {!!promise.context && !isKept && (
          <Text style={styles.cardNote} numberOfLines={1}>{promise.context}</Text>
        )}

        <View style={[styles.cardMeta, (!!promise.context || isKept) && styles.cardMetaTopMargin]}>
          {!isKept && (
            <>
              {!!deadlineLabel && (
                <View style={styles.cardMetaItem}>
                  {status === 'overdue' ? <ClockIcon /> : <MetaCalendarIcon />}
                  <Text style={[styles.cardMetaText, status === 'overdue' && styles.cardDeadlineOverdue]}>
                    {deadlineLabel}
                  </Text>
                </View>
              )}
              {!!promise.toWhom && (
                <View style={styles.cardMetaItem}>
                  <PersonIcon />
                  <Text style={styles.cardMetaText}>{promise.toWhom}</Text>
                </View>
              )}
            </>
          )}

          {isKept && (
            <>
              {!!keptLabel && <Text style={styles.keptLabel}>{keptLabel}</Text>}
              {/* Bears + hearts side by side, pushed to the right */}
              <View style={styles.likertGroup}>
                <View style={styles.likertRow}>
                  {[1,2,3,4,5].map(n => (
                    <Text key={n} style={[styles.likertEmoji, n > bearScore && styles.likertFaded]}>🐻</Text>
                  ))}
                </View>
                <View style={styles.likertRow}>
                  {[1,2,3,4,5].map(n => (
                    <Text key={n} style={[styles.likertEmoji, n > heartScore && styles.likertFaded]}>❤️</Text>
                  ))}
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── SectionHeader ──────────────────────────────────────────────────────────
function SectionHeader({ title, count }: { title: string; count: number }) {
  if (count === 0) return null;
  return (
    <View style={styles.sectionLabel}>
      <Text style={styles.sectionLabelText}>{title}</Text>
      <View style={styles.sectionPill}>
        <Text style={styles.sectionPillText}>{count}</Text>
      </View>
    </View>
  );
}

// ── HomeScreen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { promises } = usePromises();
  const router       = useRouter();
  const insets       = useSafeAreaInsets();

  const groups       = useMemo(() => groupPromises(promises), [promises]);
  const pendingCount = useMemo(() => promises.filter(p => p.status === 'pending').length, [promises]);
  const overdueCount = groups.overdue.length;
  const hasPromises  = promises.length > 0;

  // FAB sits just above the tab bar — tab bar height is 60 + bottom inset
  const fabBottom = useMemo(() => 60 + insets.bottom + 12, [insets.bottom]);

  const pushGrade = useCallback((id: string) => {
    router.push(`/modals/grade-promise?id=${id}`);
  }, [router]);
  const pushAdd = useCallback(() => {
    router.push('/modals/add-promise');
  }, [router]);

  return (
    <View style={styles.root}>

      {/* Dot-grid background — absolutely positioned behind everything */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <Pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <Circle cx="1" cy="1" r="1" fill="rgba(111,78,55,0.18)" />
            </Pattern>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#dots)" />
        </Svg>
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* Header */}
        <BlurView intensity={60} tint="light" style={styles.header}>
          {/* Logo — 🐻 stacked above ☑ ~~with me~~ */}
          <View style={styles.logoBlock}>
            <Text style={styles.bear}>🐻</Text>
            <View style={styles.titleSub}>
              <View style={styles.checkbox}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.withMe}>with me</Text>
            </View>
          </View>

          {/* Centre */}
          <View style={styles.headerCenter}>
            <Text style={styles.headerDate}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })}
            </Text>
            <Text style={styles.headerSub}>{pendingCount} promises · {overdueCount} overdue</Text>
          </View>

          {/* Right icon buttons */}
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn}>
              <SearchIcon color={COLOURS.coffee1} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <EditIcon color={COLOURS.coffee1} />
            </TouchableOpacity>
          </View>
        </BlurView>

        {/* List */}
        <ScrollView
          style={styles.main}
          contentContainerStyle={styles.mainContent}
          showsVerticalScrollIndicator={false}
        >
          {!hasPromises ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyBear}>🐻</Text>
              <Text style={styles.emptyTitle}>No promises yet</Text>
              <Text style={styles.emptySub}>
                Tap + to log your first promise.{'\n'}You said you would. Bear with me.
              </Text>
            </View>
          ) : (
            <>
              {/* Urgency legend */}
              <View style={styles.urgencyLegend}>
                <View style={styles.legendItem}><Text style={[styles.legendFlame, styles.legendFlameFaded]}>🔥</Text><Text style={styles.legendText}> none</Text></View>
                <Text style={styles.legendSep}>·</Text>
                <View style={styles.legendItem}><Text style={styles.legendFlame}>🔥</Text><Text style={styles.legendText}> low</Text></View>
                <Text style={styles.legendSep}>·</Text>
                <View style={styles.legendItem}><Text style={styles.legendFlame}>🔥🔥</Text><Text style={styles.legendText}> soon</Text></View>
                <Text style={styles.legendSep}>·</Text>
                <View style={styles.legendItem}><Text style={styles.legendFlame}>🔥🔥🔥</Text><Text style={styles.legendText}> urgent</Text></View>
              </View>

              <View style={styles.group}>
                <SectionHeader title="Overdue" count={groups.overdue.length} />
                {groups.overdue.map(p => <PromiseCard key={p.id} promise={p} onPress={() => pushGrade(p.id)} />)}
              </View>
              <View style={styles.group}>
                <SectionHeader title="This week" count={groups.thisWeek.length} />
                {groups.thisWeek.map(p => <PromiseCard key={p.id} promise={p} onPress={() => pushGrade(p.id)} />)}
              </View>
              <View style={styles.group}>
                <SectionHeader title="Upcoming" count={groups.upcoming.length} />
                {groups.upcoming.map(p => <PromiseCard key={p.id} promise={p} onPress={() => pushGrade(p.id)} />)}
              </View>
              <View style={styles.group}>
                <SectionHeader title="Recently kept" count={groups.kept.length} />
                {groups.kept.map(p => <PromiseCard key={p.id} promise={p} onPress={() => {}} />)}
              </View>
            </>
          )}
        </ScrollView>

      </SafeAreaView>

      {/* FAB — outside SafeAreaView, positioned above tab bar */}
      <TouchableOpacity style={[styles.fab, { bottom: fabBottom }]} onPress={pushAdd} activeOpacity={0.85}>
        <Text style={styles.fabPlus}>+</Text>
      </TouchableOpacity>

    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: COLOURS.bg },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLOURS.glassBorder,
    backgroundColor: Platform.OS === 'android' ? COLOURS.headerBg : 'transparent',
  },
  logoBlock: { width: 72, alignItems: 'center', gap: 2 },
  bear:      { fontSize: 36, lineHeight: 38 },
  titleSub:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkbox: {
    width: 16, height: 16, borderRadius: 4,
    backgroundColor: COLOURS.coffee1, alignItems: 'center', justifyContent: 'center',
  },
  checkmark: { color: '#fff', fontSize: 11, fontWeight: '700' },
  withMe: {
    fontFamily: FONTS.headingItalic, fontSize: 17,
    color: COLOURS.coffee2, textDecorationLine: 'line-through',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerDate:   { fontFamily: FONTS.body, fontSize: 14, fontWeight: '600', color: COLOURS.textMuted },
  headerSub:    { fontFamily: FONTS.body, fontSize: 12, color: COLOURS.textDim, marginTop: 2 },
  headerRight:  { flexDirection: 'row', gap: 7 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: COLOURS.glass, borderWidth: 1, borderColor: COLOURS.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },

  main:        { flex: 1, paddingHorizontal: 14, paddingTop: 12 },
  mainContent: { paddingBottom: 140 },

  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32, gap: 12 },
  emptyBear:  { fontSize: 64 },
  emptyTitle: { fontFamily: FONTS.heading, fontSize: SIZES.cardTitle, color: COLOURS.text },
  emptySub:   { fontFamily: FONTS.body, fontSize: SIZES.body, color: COLOURS.textMuted, textAlign: 'center', lineHeight: 24 },

  urgencyLegend: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLOURS.glass, borderWidth: 1, borderColor: COLOURS.glassBorder,
    borderRadius: 30, paddingVertical: 6, paddingHorizontal: 13,
    marginBottom: 13, alignSelf: 'flex-start',
  },
  legendItem:       { flexDirection: 'row', alignItems: 'center' },
  legendFlame:      { fontSize: 12 },
  legendFlameFaded: { opacity: 0.25 },
  legendText:       { fontFamily: FONTS.body, fontSize: 12, color: COLOURS.textMuted, fontWeight: '600' },
  legendSep:        { color: COLOURS.textDim, fontSize: 12, marginHorizontal: 2 },

  group:        { marginBottom: 16 },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionLabelText: {
    fontFamily: FONTS.body, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.9, color: COLOURS.coffee2,
  },
  sectionPill: {
    backgroundColor: COLOURS.glass, borderWidth: 1, borderColor: COLOURS.glassBorder,
    borderRadius: 20, paddingHorizontal: 9, paddingVertical: 2,
  },
  sectionPillText: { fontFamily: FONTS.body, fontSize: 11, fontWeight: '700', color: COLOURS.textMuted },

  card: {
    flexDirection: 'row', backgroundColor: COLOURS.entryBg,
    borderWidth: 1, borderColor: COLOURS.glassBorder,
    borderRadius: RADIUS.card, marginBottom: 8, overflow: 'hidden',
    shadowColor: '#6F4E37', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10, shadowRadius: 8, elevation: 3,
  },
  cardDone:            { opacity: 0.68 },
  cardStripe:          { width: 5 },
  cardInner:           { flex: 1, paddingVertical: 13, paddingHorizontal: 14, paddingBottom: 11 },
  cardTop:             { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 },
  cardTitle:           { fontFamily: FONTS.body, fontSize: 17, fontWeight: '500', color: COLOURS.text, lineHeight: 23, flex: 1 },
  cardTitleDone:       { textDecorationLine: 'line-through', color: COLOURS.textMuted },
  cardFlames:          { fontSize: 16, lineHeight: 18, letterSpacing: -1, flexShrink: 0, paddingTop: 2 },
  cardFlamesFaded:     { opacity: 0.25 },
  cardNote:            { fontFamily: FONTS.bodyItalic, fontSize: 13, color: COLOURS.textMuted, lineHeight: 18, paddingLeft: 6, borderLeftWidth: 2, borderLeftColor: COLOURS.glassBorder },
  cardMeta:            { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  cardMetaTopMargin:   { marginTop: 8 },
  cardMetaItem:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText:        { fontFamily: FONTS.body, fontSize: 13, color: COLOURS.textMuted },
  cardDeadlineOverdue: { color: COLOURS.alert, fontWeight: '600', fontSize: 12 },

  keptLabel:   { fontFamily: FONTS.body, fontSize: 13, fontWeight: '600', color: COLOURS.done },
  likertGroup: { flexDirection: 'column', gap: 2, marginLeft: 'auto' },
  likertRow:   { flexDirection: 'row', gap: 2 },
  likertEmoji: { fontSize: 13 },
  likertFaded: { opacity: 0.22 },

  fab: {
    position: 'absolute', right: 16,
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: COLOURS.coffee1, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLOURS.coffee1, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45, shadowRadius: 18, elevation: 6,
  },
  fabPlus: { color: '#fff', fontSize: 30, lineHeight: 34 },
});
