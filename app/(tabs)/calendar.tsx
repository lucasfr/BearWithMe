import { useMemo, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Rect, Defs, Pattern } from 'react-native-svg';
import { usePromises } from '../../storage/PromisesContext';
import { Promise as BwmPromise } from '../../types/promise';
import { COLOURS } from '../../theme/colours';
import { FONTS, SIZES, RADIUS } from '../../theme/typography';
import { MODAL_HANDLE, MODAL_CHIP_BG, MODAL_CHIP_SHADOW } from '../../theme/modal';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const FLAME_MAP: Record<number, string> = { 0: '🔥', 1: '🔥', 2: '🔥🔥', 3: '🔥🔥🔥' };

function isoDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1);
}

// Monday-first day index (0=Mon … 6=Sun)
function dayIndex(d: Date) {
  return (d.getDay() + 6) % 7;
}

// ── Day cell data ──────────────────────────────────────────────────────────
interface DayData {
  date:     string;        // YYYY-MM-DD
  due:      BwmPromise[];  // promises due this day
  kept:     BwmPromise[];  // promises kept this day
  created:  BwmPromise[];  // promises made this day
}

function buildCalendarData(promises: BwmPromise[]): Map<string, DayData> {
  const map = new Map<string, DayData>();

  const get = (date: string): DayData => {
    if (!map.has(date)) map.set(date, { date, due: [], kept: [], created: [] });
    return map.get(date)!;
  };

  const resolveDeadline = (p: BwmPromise): string | null => {
    // Only use specificDate if it looks like a valid ISO date (YYYY-MM-DD)
    if (p.specificDate && /^\d{4}-\d{2}-\d{2}$/.test(p.specificDate)) {
      return p.specificDate;
    }
    const created = new Date(p.createdAt);
    if (p.fuzzyDeadline === 'this-week' || p.fuzzyDeadline === 'specific') {
      // End of the week (Sunday) from the week it was created
      const d = new Date(created);
      const daysUntilSunday = (7 - d.getDay()) % 7 || 7;
      d.setDate(d.getDate() + daysUntilSunday);
      return isoDate(d);
    }
    if (p.fuzzyDeadline === 'this-month') {
      // Last day of the month it was created
      const d = new Date(created.getFullYear(), created.getMonth() + 1, 0);
      return isoDate(d);
    }
    return null; // 'none'
  };

  promises.forEach(p => {
    const deadline = resolveDeadline(p);
    if (deadline) get(deadline).due.push(p);
    if (p.keptAt) get(isoDate(new Date(p.keptAt))).kept.push(p);
    get(isoDate(new Date(p.createdAt))).created.push(p);
  });

  return map;
}

// ── Dot indicators ─────────────────────────────────────────────────────────
function DayIndicators({ data }: { data: DayData }) {
  const hasDue     = data.due.length > 0;
  const hasKept    = data.kept.length > 0;
  const hasCreated = data.created.length > 0;
  if (!hasDue && !hasKept && !hasCreated) return null;

  const maxUrgency = hasDue
    ? Math.max(...data.due.map(p => p.urgency))
    : 0;

  const bearAvg = hasKept
    ? data.kept.filter(p => p.scoreHowWell).reduce((a,p,_,arr) => a + (p.scoreHowWell ?? 0) / arr.length, 0)
    : 0;
  const heartAvg = hasKept
    ? data.kept.filter(p => p.scoreHowFelt).reduce((a,p,_,arr) => a + (p.scoreHowFelt ?? 0) / arr.length, 0)
    : 0;

  return (
    <View style={ind.row}>
      {hasDue && (
        <Text style={[ind.emoji, { opacity: maxUrgency === 0 ? 0.35 : 1 }]}>
          {FLAME_MAP[maxUrgency]}
        </Text>
      )}
      {hasKept && (
        <Text style={[ind.emoji, { opacity: bearAvg > 0 ? 0.7 + bearAvg * 0.06 : 0.4 }]}>🐻</Text>
      )}
      {hasKept && (
        <Text style={[ind.emoji, { opacity: heartAvg > 0 ? 0.7 + heartAvg * 0.06 : 0.4 }]}>❤️</Text>
      )}
      {hasCreated && !hasDue && !hasKept && (
        <View style={ind.dot} />
      )}
    </View>
  );
}

// ── Day detail sheet ───────────────────────────────────────────────────────
function DaySheet({ date, data, onClose, onPickDate }: {
  date: string;
  data: DayData | undefined;
  onClose: () => void;
  onPickDate: (promise: BwmPromise) => void;
}) {
  const insets = useSafeAreaInsets();
  const d = new Date(date + 'T12:00:00');
  const label = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const all = useMemo(() => {
    const seen = new Set<string>();
    const arr: BwmPromise[] = [];
    [...(data?.due ?? []), ...(data?.kept ?? []), ...(data?.created ?? [])].forEach(p => {
      if (!seen.has(p.id)) { seen.add(p.id); arr.push(p); }
    });
    return arr;
  }, [data]);

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={ds.root}>
        <TouchableOpacity style={ds.dismiss} activeOpacity={1} onPress={onClose} />
        <BlurView intensity={60} tint="light" style={[ds.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={MODAL_HANDLE} />
          <Text style={ds.dayLabel}>{label}</Text>

          {all.length === 0 ? (
            <Text style={ds.empty}>No promises on this day.</Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {all.map(p => {
                const isDue   = data?.due.some(x => x.id === p.id);
                const isKept  = data?.kept.some(x => x.id === p.id);
                const isMade  = data?.created.some(x => x.id === p.id) && !isDue && !isKept;
                return (
                  <View key={p.id} style={ds.item}>
                    <View style={[ds.stripe, {
                      backgroundColor: p.status === 'kept' ? COLOURS.done
                        : p.urgency === 3 ? COLOURS.alert
                        : p.urgency === 2 ? COLOURS.coffee3
                        : COLOURS.coffee2
                    }]} />
                    <View style={ds.itemBody}>
                      <Text style={ds.itemText} numberOfLines={2}>{p.text}</Text>
                      <View style={ds.itemMeta}>
                        {isDue  && <Text style={ds.tag}>📅 {p.specificDate && !/^\d{4}-\d{2}-\d{2}$/.test(p.specificDate) ? p.specificDate : 'due'}</Text>}
                        {isDue && (!p.specificDate || !/^\d{4}-\d{2}-\d{2}$/.test(p.specificDate)) && (
                          <TouchableOpacity onPress={() => onPickDate(p)}>
                            <Text style={[ds.tag, ds.setDateTag]}>📆 set date</Text>
                          </TouchableOpacity>
                        )}
                        {isKept && <Text style={ds.tag}>✓ kept</Text>}
                        {isMade && <Text style={ds.tag}>📝 made</Text>}
                        {isKept && !!p.scoreHowWell  && <Text style={ds.tag}>🐻 {p.scoreHowWell}/5</Text>}
                        {isKept && !!p.scoreHowFelt  && <Text style={ds.tag}>❤️ {p.scoreHowFelt}/5</Text>}
                        <Text style={[ds.tag, ds.flames]}>{FLAME_MAP[p.urgency]}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </BlurView>
      </View>
    </Modal>
  );
}

// ── Calendar screen ────────────────────────────────────────────────────────
export default function CalendarScreen() {
  const { promises } = usePromises();
  const today = new Date();
  const todayStr = isoDate(today);

  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [pickingPromise, setPickingPromise] = useState<BwmPromise | null>(null);
  const [pickerDate,    setPickerDate]    = useState(new Date());

  const { updatePromise } = usePromises();

  const calData = useMemo(() => buildCalendarData(promises), [promises]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }, [month]);

  // Build grid
  const grid = useMemo(() => {
    const first = startOfMonth(year, month);
    const offset = dayIndex(first);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [
      ...Array(offset).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    // Pad to complete last row
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const selectedData = selectedDate ? calData.get(selectedDate) : undefined;

  return (
    <View style={styles.root}>

      {/* Dot grid */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <Pattern id="cdots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <Circle cx="1" cy="1" r="1" fill="rgba(111,78,55,0.18)" />
            </Pattern>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#cdots)" />
        </Svg>
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* Header */}
        <BlurView intensity={60} tint="light" style={styles.header}>
          <Text style={styles.headerTitle}>Calendar</Text>
          <Text style={styles.headerSub}>
            {promises.filter(p => {
              const d = p.specificDate ?? (p.keptAt ? isoDate(new Date(p.keptAt)) : isoDate(new Date(p.createdAt)));
              return d.startsWith(`${year}-${String(month+1).padStart(2,'0')}`);
            }).length} promises this month
          </Text>
        </BlurView>

        <ScrollView style={styles.main} contentContainerStyle={styles.mainContent} showsVerticalScrollIndicator={false}>

          {/* Month navigator */}
          <View style={styles.nav}>
            <TouchableOpacity style={styles.navBtn} onPress={prevMonth} activeOpacity={0.7}>
              <Text style={styles.navArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.navTitle}>{MONTHS[month]} {year}</Text>
            <TouchableOpacity style={styles.navBtn} onPress={nextMonth} activeOpacity={0.7}>
              <Text style={styles.navArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day-of-week headers */}
          <View style={styles.dayHeaders}>
            {DAYS.map(d => (
              <Text key={d} style={styles.dayHeader}>{d}</Text>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {grid.map((day, i) => {
              if (day === null) return <View key={`empty-${i}`} style={styles.cell} />;

              const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const isToday    = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const data       = calData.get(dateStr);
              const hasData    = !!data && (data.due.length + data.kept.length + data.created.length > 0);

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[
                    styles.cell,
                    isToday    && styles.cellToday,
                    isSelected && styles.cellSelected,
                    hasData    && styles.cellHasData,
                  ]}
                  onPress={() => setSelectedDate(isSelected ? null : dateStr)}
                  activeOpacity={0.75}
                >
                  <Text style={[
                    styles.dayNum,
                    isToday    && styles.dayNumToday,
                    isSelected && styles.dayNumSelected,
                  ]}>
                    {day}
                  </Text>
                  {data && <DayIndicators data={data} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}><Text style={styles.legendEmoji}>🔥</Text><Text style={styles.legendText}>due</Text></View>
            <View style={styles.legendItem}><Text style={styles.legendEmoji}>🐻</Text><Text style={styles.legendText}>kept</Text></View>
            <View style={styles.legendItem}><Text style={styles.legendEmoji}>❤️</Text><Text style={styles.legendText}>felt</Text></View>
            <View style={styles.legendItem}><View style={styles.legendDot}/><Text style={styles.legendText}>made</Text></View>
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* Day detail sheet */}
      {selectedDate && (
        <DaySheet
          date={selectedDate}
          data={selectedData}
          onClose={() => setSelectedDate(null)}
          onPickDate={p => {
            setPickingPromise(p);
            setPickerDate(new Date());
          }}
        />
      )}

      {/* Date picker */}
      {pickingPromise && (
        <Modal transparent animationType="fade" onRequestClose={() => setPickingPromise(null)}>
          <View style={picker.backdrop}>
            <BlurView intensity={60} tint="light" style={picker.card}>
              <Text style={picker.title}>Set a date</Text>
              <Text style={picker.sub} numberOfLines={2}>{pickingPromise.text}</Text>
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display="spinner"
                onChange={(_, date) => { if (date) setPickerDate(date); }}
                style={picker.datepicker}
                textColor={COLOURS.text}
              />
              <View style={picker.btnRow}>
                <TouchableOpacity style={picker.cancelBtn} onPress={() => setPickingPromise(null)}>
                  <Text style={picker.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={picker.confirmBtn} onPress={async () => {
                  await updatePromise({ ...pickingPromise, specificDate: isoDate(pickerDate), fuzzyDeadline: 'specific' });
                  setPickingPromise(null);
                }}>
                  <Text style={picker.confirmText}>Set date</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </Modal>
      )}

    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: COLOURS.bg },
  safeArea: { flex: 1 },

  header: {
    paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: COLOURS.glassBorder,
    backgroundColor: Platform.OS === 'android' ? COLOURS.headerBg : 'transparent',
  },
  headerTitle: { fontFamily: FONTS.headingItalic, fontSize: SIZES.screenTitle, color: COLOURS.text },
  headerSub:   { fontFamily: FONTS.body, fontSize: SIZES.label, color: COLOURS.textDim, marginTop: 2 },

  main:        { flex: 1, paddingHorizontal: 12, paddingTop: 16 },
  mainContent: { paddingBottom: 100 },

  // Month navigator
  nav:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 1, borderColor: COLOURS.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  navArrow: { fontFamily: FONTS.bodyBold, fontSize: 24, color: COLOURS.coffee1, lineHeight: 28 },
  navTitle: { fontFamily: FONTS.headingItalic, fontSize: SIZES.cardTitle, color: COLOURS.text },

  // Day headers
  dayHeaders: { flexDirection: 'row', marginBottom: 6 },
  dayHeader:  { flex: 1, textAlign: 'center', fontFamily: FONTS.bodyBold, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase', color: COLOURS.textMuted },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: '14.285%', aspectRatio: 0.85,
    alignItems: 'center', justifyContent: 'flex-start',
    paddingTop: 6, paddingBottom: 4,
    borderRadius: 10,
  },
  cellToday: {
    backgroundColor: 'rgba(111,78,55,0.12)',
    borderWidth: 1.5, borderColor: COLOURS.coffee2,
  },
  cellSelected: {
    backgroundColor: 'rgba(166,123,91,0.22)',
    borderWidth: 1.5, borderColor: COLOURS.coffee1,
  },
  cellHasData: {},
  dayNum: {
    fontFamily: FONTS.body, fontSize: SIZES.label,
    color: COLOURS.text, fontWeight: '500',
  },
  dayNumToday:    { color: COLOURS.coffee1, fontWeight: '700' },
  dayNumSelected: { color: COLOURS.coffee1, fontWeight: '700' },

  // Legend
  legend: {
    flexDirection: 'row', justifyContent: 'center', gap: 20,
    marginTop: 20, paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1, borderColor: COLOURS.glassBorder,
    borderRadius: RADIUS.pill,
  },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendEmoji: { fontSize: 14 },
  legendDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: COLOURS.coffee2 },
  legendText:  { fontFamily: FONTS.body, fontSize: SIZES.label, color: COLOURS.textMuted },
});

// ── Indicator styles ───────────────────────────────────────────────────────
const ind = StyleSheet.create({
  row:   { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 1, marginTop: 2 },
  emoji: { fontSize: 8, lineHeight: 10 },
  dot:   { width: 5, height: 5, borderRadius: 3, backgroundColor: COLOURS.coffee2, marginTop: 3 },
});

// ── Day sheet styles ───────────────────────────────────────────────────────
const ds = StyleSheet.create({
  root:    { flex: 1, justifyContent: 'flex-end' },
  dismiss: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1.5, borderTopColor: 'rgba(255,255,255,0.80)',
    paddingHorizontal: 20, paddingTop: 14, maxHeight: '70%',
    shadowColor: '#2C1A0E', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 12,
  },
  dayLabel: { fontFamily: FONTS.headingItalic, fontSize: SIZES.cardTitle, color: COLOURS.text, marginBottom: 16 },
  empty:    { fontFamily: FONTS.body, fontSize: SIZES.body, color: COLOURS.textMuted, textAlign: 'center', paddingVertical: 24 },
  item: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1, borderColor: COLOURS.glassBorder,
    borderRadius: RADIUS.card, marginBottom: 8, overflow: 'hidden',
  },
  stripe:   { width: 5 },
  itemBody: { flex: 1, paddingVertical: 10, paddingHorizontal: 12 },
  itemText: { fontFamily: FONTS.body, fontSize: SIZES.bodySmall, fontWeight: '500', color: COLOURS.text, marginBottom: 6 },
  itemMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    fontFamily: FONTS.bodyBold, fontSize: 10, color: COLOURS.textMuted,
    backgroundColor: COLOURS.glass, borderWidth: 1, borderColor: COLOURS.glassBorder,
    borderRadius: 20, paddingVertical: 2, paddingHorizontal: 7,
  },
  flames:   { color: COLOURS.coffee2 },
});
