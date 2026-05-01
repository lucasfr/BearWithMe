import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Svg, { Line, Path, Circle, Rect, Defs, Pattern } from 'react-native-svg';
import { usePromises } from '../../storage/PromisesContext';
import { Promise as BwmPromise } from '../../types/promise';
import { COLOURS } from '../../theme/colours';
import { FONTS, SIZES, RADIUS } from '../../theme/typography';

// ── Types ──────────────────────────────────────────────────────────────────
type Window = '7d' | '30d' | 'all';
interface WindowData {
  made: number; kept: number; overdue: number; keepRate: number;
  bearAvg: number; heartAvg: number; sub: string;
  labels: string[]; bears: number[]; hearts: number[];
  urgency: { flame: string; faded?: boolean; count: number; pct: number; color: string }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
function startOf(date: Date, unit: 'day' | 'week' | 'month') {
  const d = new Date(date);
  if (unit === 'day')   { d.setHours(0,0,0,0); }
  if (unit === 'week')  { d.setHours(0,0,0,0); d.setDate(d.getDate() - d.getDay()); }
  if (unit === 'month') { d.setHours(0,0,0,0); d.setDate(1); }
  return d;
}

function computeWindowData(promises: BwmPromise[], win: Window): WindowData {
  const now = new Date();
  const cutoff = win === '7d' ? new Date(now.getTime() - 7*86400000)
               : win === '30d' ? new Date(now.getTime() - 30*86400000)
               : new Date(0);

  const inWindow = promises.filter(p => new Date(p.createdAt) >= cutoff);
  const kept     = inWindow.filter(p => p.status === 'kept');
  const overdue  = inWindow.filter(p => p.status === 'overdue' || (p.status === 'pending' && p.specificDate && new Date(p.specificDate) < now));
  const made = inWindow.length;
  const keptN = kept.length;
  const keepRate = made > 0 ? Math.round((keptN / made) * 100) : 0;

  const bearScores  = kept.filter(p => p.scoreHowWell).map(p => p.scoreHowWell!);
  const heartScores = kept.filter(p => p.scoreHowFelt).map(p => p.scoreHowFelt!);
  const avg = (arr: number[]) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
  const bearAvg  = avg(bearScores);
  const heartAvg = avg(heartScores);
  const sub = win === '7d' ? 'in the last 7 days' : win === '30d' ? 'in the last 30 days' : 'since you started';

  // Chart series
  let labels: string[] = [], bears: number[] = [], hearts: number[] = [];
  if (win === '7d') {
    labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const ds = startOf(d, 'day'), de = new Date(ds.getTime() + 86400000);
      const dk = kept.filter(p => p.keptAt && new Date(p.keptAt) >= ds && new Date(p.keptAt) < de);
      bears.push(avg(dk.filter(p=>p.scoreHowWell).map(p=>p.scoreHowWell!)));
      hearts.push(avg(dk.filter(p=>p.scoreHowFelt).map(p=>p.scoreHowFelt!)));
    }
  } else if (win === '30d') {
    for (let i = 3; i >= 0; i--) {
      const ws = new Date(now); ws.setDate(ws.getDate() - i*7 - 6);
      const we = new Date(now); we.setDate(we.getDate() - i*7 + 1);
      labels.push(`W${4-i}`);
      const wk = kept.filter(p => p.keptAt && new Date(p.keptAt) >= ws && new Date(p.keptAt) < we);
      bears.push(avg(wk.filter(p=>p.scoreHowWell).map(p=>p.scoreHowWell!)));
      hearts.push(avg(wk.filter(p=>p.scoreHowFelt).map(p=>p.scoreHowFelt!)));
    }
  } else {
    const mm = new Map<string,{b:number[];h:number[]}>();
    kept.forEach(p => {
      if (!p.keptAt) return;
      const d = new Date(p.keptAt), key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!mm.has(key)) mm.set(key, {b:[],h:[]});
      if (p.scoreHowWell) mm.get(key)!.b.push(p.scoreHowWell);
      if (p.scoreHowFelt) mm.get(key)!.h.push(p.scoreHowFelt);
    });
    [...mm.entries()].sort(([a],[b])=>a.localeCompare(b)).forEach(([key,{b,h}]) => {
      const [yr,mo] = key.split('-').map(Number);
      labels.push(new Date(yr,mo,1).toLocaleDateString('en-GB',{month:'short'}));
      bears.push(avg(b)); hearts.push(avg(h));
    });
    if (!labels.length) { labels=['—']; bears=[0]; hearts=[0]; }
  }

  // Urgency
  const counts = [0,1,2,3].map(u => inWindow.filter(p=>p.urgency===u).length);
  const urgency = [
    {flame:'🔥🔥🔥', count:counts[3], pct:made?Math.round(counts[3]/made*100):0, color:COLOURS.alert},
    {flame:'🔥🔥',   count:counts[2], pct:made?Math.round(counts[2]/made*100):0, color:COLOURS.coffee3},
    {flame:'🔥',     count:counts[1], pct:made?Math.round(counts[1]/made*100):0, color:COLOURS.coffee2},
    {flame:'🔥',     count:counts[0], pct:made?Math.round(counts[0]/made*100):0, color:COLOURS.textDim, faded:true},
  ];

  return { made, kept:keptN, overdue:overdue.length, keepRate, bearAvg, heartAvg, sub, labels, bears, hearts, urgency };
}

function scoreEmoji(avg: number, filled: string, empty: string) {
  return Array.from({length:5},(_,i)=>i<Math.round(avg)?filled:empty).join('');
}

// ── Line chart ─────────────────────────────────────────────────────────────
function LineChart({ labels, bears, hearts }: { labels: string[]; bears: number[]; hearts: number[] }) {
  const W = 100, H = 70, padX = 2, padY = 4;
  const n = labels.length;
  if (n < 2) return null;
  const xs = labels.map((_,i) => padX + (i/(n-1))*(W-padX*2));
  const yv = (v: number) => H - padY - ((v/5)*(H-padY*2));
  const linePath = (vals: number[]) => vals.map((v,i)=>`${i===0?'M':'L'}${xs[i].toFixed(2)},${yv(v).toFixed(2)}`).join(' ');
  const areaPath = (vals: number[]) => linePath(vals)+` L${xs[n-1].toFixed(2)},${H} L${xs[0].toFixed(2)},${H} Z`;
  return (
    <View>
      <Svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{height:160}}>
        {[0,17.5,35,52.5,70].map(y=><Line key={y} x1="0" y1={y} x2={W} y2={y} stroke="rgba(196,169,140,0.25)" strokeWidth="0.5"/>)}
        <Path d={areaPath(bears)}  fill="rgba(111,78,55,0.10)"/>
        <Path d={areaPath(hearts)} fill="rgba(192,97,74,0.10)"/>
        <Path d={linePath(bears)}  fill="none" stroke={COLOURS.coffee1} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d={linePath(hearts)} fill="none" stroke={COLOURS.alert}   strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        {bears.map((v,i)  => <Circle key={`b${i}`} cx={xs[i]} cy={yv(v)} r="1.8" fill={COLOURS.coffee1} stroke="#fff" strokeWidth="0.8"/>)}
        {hearts.map((v,i) => <Circle key={`h${i}`} cx={xs[i]} cy={yv(v)} r="1.8" fill={COLOURS.alert}   stroke="#fff" strokeWidth="0.8"/>)}
      </Svg>
      <View style={chart.labels}>
        {labels.map(l=><Text key={l} style={chart.label}>{l}</Text>)}
      </View>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────
export default function ReportScreen() {
  const { promises } = usePromises();
  const [win, setWin] = useState<Window>('30d');
  const data = useMemo(() => computeWindowData(promises, win), [promises, win]);

  const WINDOWS: {key:Window; label:string}[] = [
    {key:'7d',  label:'7 days'},
    {key:'30d', label:'30 days'},
    {key:'all', label:'All time'},
  ];

  return (
    <View style={styles.root}>

      {/* Dot grid */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <Pattern id="rdots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <Circle cx="1" cy="1" r="1" fill="rgba(111,78,55,0.18)"/>
            </Pattern>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#rdots)"/>
        </Svg>
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* Glassy header — matches home */}
        <BlurView intensity={60} tint="light" style={styles.header}>
          <Text style={styles.headerTitle}>Report</Text>
          <Text style={styles.headerSub}>{data.made} promises · {data.kept} kept</Text>
        </BlurView>

        <ScrollView style={styles.main} contentContainerStyle={styles.mainContent} showsVerticalScrollIndicator={false}>

          {/* Time switcher */}
          <View style={styles.switcher}>
            {WINDOWS.map(w => (
              <TouchableOpacity
                key={w.key}
                style={[styles.switchBtn, win === w.key && styles.switchBtnActive]}
                onPress={() => setWin(w.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.switchBtnText, win === w.key && styles.switchBtnTextActive]}>
                  {w.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Overview */}
          <Text style={styles.sectionLabel}>Overview</Text>
          <View style={styles.statGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Promises made</Text>
              <Text style={styles.statValue}>{data.made}</Text>
              <Text style={styles.statSub}>{data.sub}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Kept</Text>
              <Text style={styles.statValue}>{data.kept}</Text>
              <Text style={styles.statSub}>{data.keepRate}% keep rate</Text>
            </View>
            <View style={[styles.statCard, styles.statCardFull]}>
              <View style={styles.kbBarBg}>
                <View style={[styles.kbBarFill, {width:`${data.keepRate}%` as any}]}/>
              </View>
              <View style={styles.kbLabels}>
                <Text style={styles.kbKept}>{data.kept} kept ✓</Text>
                <Text style={styles.kbOverdue}>{data.overdue} overdue</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>How well</Text>
              <Text style={styles.statEmoji}>{scoreEmoji(data.bearAvg,'🐻','🤍')}</Text>
              <Text style={styles.statSub}>{data.bearAvg.toFixed(1)} / 5</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>How it felt</Text>
              <Text style={styles.statEmoji}>{scoreEmoji(data.heartAvg,'❤️','🤍')}</Text>
              <Text style={styles.statSub}>{data.heartAvg.toFixed(1)} / 5</Text>
            </View>
          </View>

          {/* Trend */}
          <Text style={styles.sectionLabel}>Trend</Text>
          <View style={styles.card}>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot,{backgroundColor:COLOURS.coffee1}]}/>
                <Text style={styles.legendText}>how well 🐻</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot,{backgroundColor:COLOURS.alert}]}/>
                <Text style={styles.legendText}>how it felt ❤️</Text>
              </View>
            </View>
            <LineChart labels={data.labels} bears={data.bears} hearts={data.hearts}/>
          </View>

          {/* By urgency */}
          <Text style={styles.sectionLabel}>By urgency</Text>
          <View style={styles.card}>
            {data.urgency.map((u,i) => {
              const maxC = Math.max(...data.urgency.map(x=>x.count),1);
              return (
                <View key={i} style={[styles.urgencyRow, i===data.urgency.length-1 && styles.urgencyRowLast]}>
                  <Text style={[styles.urgencyFlame, u.faded && styles.urgencyFlameFaded]}>{u.flame}</Text>
                  <View style={styles.urgencyBarBg}>
                    <View style={[styles.urgencyBarFill,{width:`${Math.round(u.count/maxC*100)}%` as any, backgroundColor:u.color}]}/>
                  </View>
                  <Text style={styles.urgencyCount}>{u.count}</Text>
                  <Text style={styles.urgencyPct}>{u.pct}%</Text>
                </View>
              );
            })}
          </View>


        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const GLASS_CARD = 'rgba(255,255,255,0.55)';

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: COLOURS.bg },
  safeArea: { flex: 1 },

  // Header — matches home BlurView header
  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLOURS.glassBorder,
    alignItems: 'center',
    backgroundColor: Platform.OS === 'android' ? COLOURS.headerBg : 'transparent',
  },
  headerTitle: {
    fontFamily: FONTS.headingItalic, fontSize: SIZES.screenTitle,
    color: COLOURS.text,
  },
  headerSub: {
    fontFamily: FONTS.body, fontSize: SIZES.label,
    color: COLOURS.textDim, marginTop: 2,
  },

  main:        { flex: 1, paddingHorizontal: 14, paddingTop: 14 },
  mainContent: { paddingBottom: 100 },

  // Time switcher
  switcher: {
    flexDirection: 'row', gap: 6, marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.50)',
    borderWidth: 1, borderColor: COLOURS.glassBorder,
    borderRadius: 30, padding: 4,
  },
  switchBtn:           { flex: 1, paddingVertical: 8, borderRadius: 30, alignItems: 'center' },
  switchBtnActive:     { backgroundColor: COLOURS.coffee1, shadowColor: COLOURS.coffee1, shadowOffset:{width:0,height:2}, shadowOpacity:0.30, shadowRadius:8, elevation:4 },
  switchBtnText:       { fontFamily: FONTS.bodyBold, fontSize: SIZES.label, color: COLOURS.textMuted },
  switchBtnTextActive: { color: '#fff' },

  sectionLabel: {
    fontFamily: FONTS.bodyBold, fontSize: 10, letterSpacing: 0.9,
    textTransform: 'uppercase', color: COLOURS.coffee2, marginBottom: 10,
  },

  // Stat cards — glass
  statGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  statCard: {
    width: '47.5%', backgroundColor: GLASS_CARD,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.70)',
    borderRadius: RADIUS.card, padding: 14, gap: 4,
    shadowColor: '#6F4E37', shadowOffset:{width:0,height:2}, shadowOpacity:0.08, shadowRadius:12, elevation:3,
  },
  statCardFull:  { width: '100%' },
  statLabel:     { fontFamily: FONTS.bodyBold, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', color: COLOURS.textMuted },
  statValue:     { fontFamily: FONTS.heading, fontSize: 28, color: COLOURS.text, lineHeight: 32 },
  statSub:       { fontFamily: FONTS.body, fontSize: SIZES.label, color: COLOURS.textDim },
  statEmoji:     { fontSize: 20, letterSpacing: 1 },

  kbBarBg:   { height: 10, borderRadius: 99, backgroundColor: 'rgba(196,169,140,0.25)', overflow: 'hidden', marginVertical: 6 },
  kbBarFill: { height: '100%', borderRadius: 99, backgroundColor: COLOURS.done },
  kbLabels:  { flexDirection: 'row', justifyContent: 'space-between' },
  kbKept:    { fontFamily: FONTS.bodyBold, fontSize: 11, color: COLOURS.done },
  kbOverdue: { fontFamily: FONTS.bodyBold, fontSize: 11, color: COLOURS.alert },

  // Content cards — glass
  card: {
    backgroundColor: GLASS_CARD,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.70)',
    borderRadius: RADIUS.card, padding: 14, marginBottom: 20,
    shadowColor: '#6F4E37', shadowOffset:{width:0,height:2}, shadowOpacity:0.08, shadowRadius:12, elevation:3,
  },

  chartLegend: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:   { width: 8, height: 8, borderRadius: 4 },
  legendText:  { fontFamily: FONTS.bodyBold, fontSize: SIZES.label, color: COLOURS.textMuted },

  urgencyRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: COLOURS.glassBorder },
  urgencyRowLast:    { borderBottomWidth: 0 },
  urgencyFlame:      { fontSize: 15, letterSpacing: -1, width: 68, flexShrink: 0 },
  urgencyFlameFaded: { opacity: 0.28 },
  urgencyBarBg:      { flex: 1, height: 8, borderRadius: 99, backgroundColor: 'rgba(196,169,140,0.20)', overflow: 'hidden' },
  urgencyBarFill:    { height: '100%', borderRadius: 99 },
  urgencyCount:      { fontFamily: FONTS.bodyBold, fontSize: SIZES.label, color: COLOURS.textMuted, width: 28, textAlign: 'right' },
  urgencyPct:        { fontFamily: FONTS.body, fontSize: 11, color: COLOURS.textDim, width: 32, textAlign: 'right' },


});

const chart = StyleSheet.create({
  labels: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6 },
  label:  { fontFamily: FONTS.bodyBold, fontSize: 11, color: COLOURS.textDim, flex: 1, textAlign: 'center' },
});
