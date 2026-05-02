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
import { MODAL_HANDLE } from '../../theme/modal';

const DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const FLAME_MAP: Record<number,string> = { 0:'🔥', 1:'🔥', 2:'🔥🔥', 3:'🔥🔥🔥' };

function isoDate(d: Date) { return d.toISOString().split('T')[0]; }
function startOfMonth(y: number, m: number) { return new Date(y, m, 1); }
function dayIndex(d: Date) { return (d.getDay() + 6) % 7; }

interface DayData {
  date: string; due: BwmPromise[]; kept: BwmPromise[]; created: BwmPromise[];
}

function buildCalendarData(promises: BwmPromise[]): Map<string, DayData> {
  const map = new Map<string, DayData>();
  const get = (date: string): DayData => {
    if (!map.has(date)) map.set(date, { date, due: [], kept: [], created: [] });
    return map.get(date)!;
  };
  const resolveDeadline = (p: BwmPromise): string | null => {
    if (p.specificDate && /^\d{4}-\d{2}-\d{2}$/.test(p.specificDate)) return p.specificDate;
    const created = new Date(p.createdAt);
    if (p.fuzzyDeadline === 'this-week' || p.fuzzyDeadline === 'specific') {
      const d = new Date(created);
      const daysUntilSunday = (7 - d.getDay()) % 7 || 7;
      d.setDate(d.getDate() + daysUntilSunday);
      return isoDate(d);
    }
    if (p.fuzzyDeadline === 'this-month')
      return isoDate(new Date(created.getFullYear(), created.getMonth() + 1, 0));
    return null;
  };
  promises.forEach(p => {
    const deadline = resolveDeadline(p);
    if (deadline) get(deadline).due.push(p);
    if (p.keptAt) get(isoDate(new Date(p.keptAt))).kept.push(p);
    get(isoDate(new Date(p.createdAt))).created.push(p);
  });
  return map;
}

function DayIndicators({ data, activeFilters }: { data: DayData; activeFilters: string[] }) {
  const hasDue     = data.due.length > 0;
  const hasKept    = data.kept.length > 0;
  const hasCreated = data.created.length > 0;
  if (!hasDue && !hasKept && !hasCreated) return null;
  const maxUrgency = hasDue ? Math.max(...data.due.map(p => p.urgency)) : 0;
  const bearAvg  = hasKept ? data.kept.filter(p=>p.scoreHowWell).reduce((a,p,_,arr)=>a+(p.scoreHowWell??0)/arr.length,0) : 0;
  const heartAvg = hasKept ? data.kept.filter(p=>p.scoreHowFelt).reduce((a,p,_,arr)=>a+(p.scoreHowFelt??0)/arr.length,0) : 0;
  const noFilter = activeFilters.length === 0;
  const showFlame = noFilter || activeFilters.includes('due');
  const showBear  = noFilter || activeFilters.includes('kept');
  const showHeart = noFilter || activeFilters.includes('felt');
  const showDot   = noFilter || activeFilters.includes('made');
  return (
    <View style={ind.row}>
      {hasDue  && showFlame && <Text style={[ind.emoji,{opacity:maxUrgency===0?0.35:1}]}>{FLAME_MAP[maxUrgency]}</Text>}
      {hasKept && showBear  && <Text style={[ind.emoji,{opacity:bearAvg>0?0.7+bearAvg*0.06:0.4}]}>🐻</Text>}
      {hasKept && showHeart && <Text style={[ind.emoji,{opacity:heartAvg>0?0.7+heartAvg*0.06:0.4}]}>❤️</Text>}
      {hasCreated && !hasDue && !hasKept && showDot && <View style={ind.dot}/>}
    </View>
  );
}

function DaySheet({ date, data, onClose, onPickDate }: {
  date: string; data: DayData | undefined;
  onClose: () => void; onPickDate: (p: BwmPromise) => void;
}) {
  const insets = useSafeAreaInsets();
  const label = new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const all = useMemo(() => {
    const seen = new Set<string>(), arr: BwmPromise[] = [];
    [...(data?.due??[]),...(data?.kept??[]),...(data?.created??[])].forEach(p => {
      if (!seen.has(p.id)) { seen.add(p.id); arr.push(p); }
    });
    return arr;
  }, [data]);

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={ds.root}>
        <TouchableOpacity style={ds.dismiss} activeOpacity={1} onPress={onClose}/>
        <BlurView intensity={60} tint="light" style={[ds.sheet,{paddingBottom:insets.bottom+20}]}>
          <View style={MODAL_HANDLE}/>
          <Text style={ds.dayLabel}>{label}</Text>
          {all.length === 0 ? (
            <Text style={ds.empty}>No promises on this day.</Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {all.map(p => {
                const isDue  = data?.due.some(x=>x.id===p.id);
                const isKept = data?.kept.some(x=>x.id===p.id);
                const isMade = data?.created.some(x=>x.id===p.id) && !isDue && !isKept;
                const hasFuzzyDate = !p.specificDate || !/^\d{4}-\d{2}-\d{2}$/.test(p.specificDate);
                return (
                  <View key={p.id} style={ds.item}>
                    <View style={[ds.stripe,{backgroundColor:
                      p.status==='kept'?COLOURS.done:p.urgency===3?COLOURS.alert:p.urgency===2?COLOURS.coffee3:COLOURS.coffee2
                    }]}/>
                    <View style={ds.itemBody}>
                      <Text style={ds.itemText} numberOfLines={2}>{p.text}</Text>
                      <View style={ds.itemMeta}>
                        {isDue  && <Text style={ds.tag}>📅 {p.specificDate && hasFuzzyDate ? p.specificDate : 'due'}</Text>}
                        {isDue  && hasFuzzyDate && (
                          <TouchableOpacity onPress={() => onPickDate(p)}>
                            <Text style={[ds.tag, ds.setDateTag]}>📆 set date</Text>
                          </TouchableOpacity>
                        )}
                        {isKept && <Text style={ds.tag}>✅ kept</Text>}
                        {isMade && <Text style={ds.tag}>📝 made</Text>}
                        {isKept && !!p.scoreHowWell && <Text style={ds.tag}>🐻 {p.scoreHowWell}/5</Text>}
                        {isKept && !!p.scoreHowFelt && <Text style={ds.tag}>❤️ {p.scoreHowFelt}/5</Text>}
                        <Text style={[ds.tag,ds.flames]}>{FLAME_MAP[p.urgency]}</Text>
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

export default function CalendarScreen() {
  const { promises, updatePromise } = usePromises();
  const today    = new Date();
  const todayStr = isoDate(today);

  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate,   setSelectedDate]   = useState<string | null>(null);
  const [pickingPromise, setPickingPromise] = useState<BwmPromise | null>(null);
  const [pickerDate,     setPickerDate]     = useState(new Date());

  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const toggleFilter = useCallback((f: string) => {
    setActiveFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }, []);

  const calData = useMemo(() => buildCalendarData(promises), [promises]);

  const prevMonth = useCallback(() => {
    setMonth(m => { if (m === 0) { setYear(y => y-1); return 11; } return m-1; });
  }, []);
  const nextMonth = useCallback(() => {
    setMonth(m => { if (m === 11) { setYear(y => y+1); return 0; } return m+1; });
  }, []);

  const grid = useMemo(() => {
    const first  = startOfMonth(year, month);
    const offset = dayIndex(first);
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const cells: (number|null)[] = [...Array(offset).fill(null), ...Array.from({length:daysInMonth},(_,i)=>i+1)];
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const filteredCalData = useMemo(() => {
    if (activeFilters.length === 0) return calData;
    const filtered = new Map<string, DayData>();
    calData.forEach((data, date) => {
      const show =
        (activeFilters.includes('due')  && data.due.length > 0) ||
        (activeFilters.includes('kept') && data.kept.length > 0) ||
        (activeFilters.includes('felt') && data.kept.some(p => (p.scoreHowFelt ?? 0) > 0)) ||
        (activeFilters.includes('made') && data.created.length > 0);
      if (show) filtered.set(date, data);
    });
    return filtered;
  }, [calData, activeFilters]);

  const selectedData = selectedDate ? calData.get(selectedDate) : undefined;

  const handleConfirmDate = useCallback(async () => {
    if (!pickingPromise) return;
    await updatePromise({ ...pickingPromise, specificDate: isoDate(pickerDate), fuzzyDeadline: 'specific' });
    setPickingPromise(null);
  }, [pickingPromise, pickerDate, updatePromise]);

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <Pattern id="cdots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <Circle cx="1" cy="1" r="1" fill="rgba(111,78,55,0.18)"/>
            </Pattern>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#cdots)"/>
        </Svg>
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <BlurView intensity={60} tint="light" style={styles.header}>
          <Text style={styles.headerTitle}>Calendar</Text>
          <Text style={styles.headerSub}>
            {promises.filter(p => {
              const d = p.specificDate && /^\d{4}-\d{2}-\d{2}$/.test(p.specificDate)
                ? p.specificDate
                : p.keptAt ? isoDate(new Date(p.keptAt)) : isoDate(new Date(p.createdAt));
              return d.startsWith(`${year}-${String(month+1).padStart(2,'0')}`);
            }).length} promises this month
          </Text>
        </BlurView>

        <ScrollView style={styles.main} contentContainerStyle={styles.mainContent} showsVerticalScrollIndicator={false}>
          <View style={styles.nav}>
            <TouchableOpacity style={styles.navBtn} onPress={prevMonth} activeOpacity={0.7}>
              <Text style={styles.navArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.navTitle}>{MONTHS[month]} {year}</Text>
            <TouchableOpacity style={styles.navBtn} onPress={nextMonth} activeOpacity={0.7}>
              <Text style={styles.navArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dayHeaders}>
            {DAYS.map(d => <Text key={d} style={styles.dayHeader}>{d}</Text>)}
          </View>

          <View style={styles.grid}>
            {grid.map((day, i) => {
              if (day === null) return <View key={`e${i}`} style={styles.cell}/>;
              const dateStr  = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const isToday    = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const data = filteredCalData.get(dateStr);
              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[styles.cell, isToday&&styles.cellToday, isSelected&&styles.cellSelected]}
                  onPress={() => setSelectedDate(isSelected ? null : dateStr)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.dayNum, isToday&&styles.dayNumToday, isSelected&&styles.dayNumSelected]}>
                    {day}
                  </Text>
                  {data && <DayIndicators data={data} activeFilters={activeFilters}/>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Filter chips */}
          <View style={styles.filterRow}>
            {[
              { key: 'due',  label: '🔥' },
              { key: 'kept', label: '🐻' },
              { key: 'felt', label: '❤️' },
              { key: 'made', label: '📝' },
            ].map(f => {
              const active = activeFilters.includes(f.key);
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => toggleFilter(f.key)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.filterChipText}>{f.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>

      {selectedDate && (
        <DaySheet
          date={selectedDate}
          data={selectedData}
          onClose={() => setSelectedDate(null)}
          onPickDate={p => { setPickingPromise(p); setPickerDate(new Date()); }}
        />
      )}

      {/* Date picker modal — BlurView card matching other modals */}
      {pickingPromise && (
        <Modal transparent animationType="fade" onRequestClose={() => setPickingPromise(null)}>
          <View style={pk.backdrop}>
            <BlurView intensity={60} tint="light" style={pk.card}>
              <Text style={pk.title}>Set a date</Text>
              <Text style={pk.sub} numberOfLines={2}>{pickingPromise.text}</Text>
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display="spinner"
                onChange={(_, date) => { if (date) setPickerDate(date); }}
                style={pk.datepicker}
                textColor={COLOURS.text}
              />
              <View style={pk.btnRow}>
                <TouchableOpacity style={pk.cancelBtn} onPress={() => setPickingPromise(null)}>
                  <Text style={pk.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={pk.confirmBtn} onPress={handleConfirmDate}>
                  <Text style={pk.confirmText}>Set date</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </Modal>
      )}
    </View>
  );
}

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
  nav:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn:   { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 1, borderColor: COLOURS.glassBorder, alignItems: 'center', justifyContent: 'center' },
  navArrow: { fontFamily: FONTS.bodyBold, fontSize: 24, color: COLOURS.coffee1, lineHeight: 28 },
  navTitle: { fontFamily: FONTS.headingItalic, fontSize: SIZES.cardTitle, color: COLOURS.text },
  dayHeaders: { flexDirection: 'row', marginBottom: 6 },
  dayHeader:  { flex: 1, textAlign: 'center', fontFamily: FONTS.bodyBold, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase', color: COLOURS.textMuted },
  grid:     { flexDirection: 'row', flexWrap: 'wrap' },
  cell:     { width: '14.285%', height: 56, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 8, paddingBottom: 4, borderRadius: 10 },
  cellToday:    { backgroundColor: 'rgba(111,78,55,0.12)', borderWidth: 1.5, borderColor: COLOURS.coffee2 },
  cellSelected: { backgroundColor: 'rgba(166,123,91,0.22)', borderWidth: 1.5, borderColor: COLOURS.coffee1 },
  dayNum:          { fontFamily: FONTS.body, fontSize: SIZES.bodySmall, color: COLOURS.text, fontWeight: '500' },
  dayNumToday:     { color: COLOURS.coffee1, fontWeight: '700' },
  dayNumSelected:  { color: COLOURS.coffee1, fontWeight: '700' },
  filterRow:           { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 4, justifyContent: 'center' },
  filterChip:           {
    paddingVertical: 8, paddingHorizontal: 14,
    backgroundColor: COLOURS.glass, borderWidth: 1, borderColor: COLOURS.glassBorder, borderRadius: 30,
    shadowColor: '#6F4E37', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  filterChipActive:     { backgroundColor: 'rgba(166,123,91,0.28)' },
  filterChipText:       { fontSize: SIZES.label },
});

const ind = StyleSheet.create({
  row:   { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 1, marginTop: 2 },
  emoji: { fontSize: 10, lineHeight: 13 },
  dot:   { width: 5, height: 5, borderRadius: 3, backgroundColor: COLOURS.coffee2, marginTop: 3 },
});

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
  item:     {
    flexDirection: 'row', backgroundColor: COLOURS.entryBg,
    borderWidth: 1, borderColor: COLOURS.glassBorder,
    borderRadius: RADIUS.card, marginBottom: 8, overflow: 'hidden',
    shadowColor: '#6F4E37', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 3,
  },
  stripe:   { width: 5 },
  itemBody: { flex: 1, paddingVertical: 10, paddingHorizontal: 12 },
  itemText: { fontFamily: FONTS.body, fontSize: SIZES.bodySmall, fontWeight: '500', color: COLOURS.text, marginBottom: 6 },
  itemMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:      { fontFamily: FONTS.bodyBold, fontSize: 10, color: COLOURS.textMuted, backgroundColor: COLOURS.glass, borderWidth: 1, borderColor: COLOURS.glassBorder, borderRadius: 20, paddingVertical: 2, paddingHorizontal: 7 },
  flames:     { color: COLOURS.coffee2 },
  setDateTag: { color: COLOURS.coffee1, borderColor: COLOURS.coffee2 },
});

const pk = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(44,26,14,0.45)',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  card: {
    width: '100%', borderRadius: 28, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.80)',
    shadowColor: '#6F4E37', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, shadowRadius: 18, elevation: 8,
    padding: 24, alignItems: 'center',
  },
  title:       { fontFamily: FONTS.headingItalic, fontSize: SIZES.screenTitle, color: COLOURS.text, marginBottom: 6 },
  sub:         { fontFamily: FONTS.bodyItalic, fontSize: SIZES.bodySmall, color: COLOURS.textMuted, textAlign: 'center', marginBottom: 8 },
  datepicker:  { width: '100%', marginBottom: 16 },
  btnRow:      { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn:   { flex: 1, paddingVertical: 15, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.60)', borderRadius: 20, shadowColor: '#6F4E37', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 10, elevation: 4 },
  cancelText:  { fontFamily: FONTS.bodyBold, fontSize: SIZES.bodySmall, color: COLOURS.textMuted },
  confirmBtn:  { flex: 1, paddingVertical: 15, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.60)', borderRadius: 20, shadowColor: '#6F4E37', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 18, elevation: 8 },
  confirmText: { fontFamily: FONTS.bodyBold, fontSize: SIZES.bodySmall, color: COLOURS.coffee1 },
});
