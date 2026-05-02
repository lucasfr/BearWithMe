import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Modal, TextInput,
} from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Polyline, Path, Line, Rect, Defs, Pattern } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { usePromises } from '../../storage/PromisesContext';
import { groupPromises, computeStatus } from '../../utils/promise';
import { Promise as BwmPromise } from '../../types/promise';
import { COLOURS } from '../../theme/colours';
import { FONTS, SIZES, RADIUS } from '../../theme/typography';
import { MODAL_CHIP_BG, MODAL_CHIP_SHADOW, MODAL_HANDLE, MODAL_GLASS_BG } from '../../theme/modal';

const EGG_TEXT = [
  'This app was made for people who care about others and sometimes struggle to follow through; not because they don\'t want to, but because their brain is just wired differently.',
  'You said you would. That already counts.'
].join('\n\n');

// ── SVG icons ─────────────────────────────────────────────────────────────
const ClockIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={COLOURS.alert} strokeWidth={2.5}>
    <Circle cx="12" cy="12" r="10" /><Polyline points="12 6 12 12 16 14" />
  </Svg>
);
const MetaCalendarIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={COLOURS.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <Line x1="16" y1="2" x2="16" y2="6" /><Line x1="8" y1="2" x2="8" y2="6" /><Line x1="3" y1="10" x2="21" y2="10" />
  </Svg>
);
const PersonIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={COLOURS.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" />
  </Svg>
);
const SearchIcon = ({ color }: { color: string }) => (
  <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="8" /><Path d="m21 21-4.35-4.35" />
  </Svg>
);
const TrashIcon = ({ color }: { color: string }) => (
  <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
  </Svg>
);
const XIcon = ({ color }: { color: string }) => (
  <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round">
    <Path d="M18 6 6 18M6 6l12 12" />
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

// ── Card action sheet ──────────────────────────────────────────────────────
function CardActionSheet({ promise, onClose, onMarkDone, onEdit, onDelete }: {
  promise: BwmPromise; onClose: () => void; onMarkDone: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={sheet.modalRoot}>
        <TouchableOpacity style={sheet.dismissArea} activeOpacity={1} onPress={onClose} />
        <BlurView intensity={60} tint="light" style={sheet.container}>
          <View style={MODAL_HANDLE} />
          <Text style={sheet.promiseText} numberOfLines={2}>{promise.text}</Text>
          {confirmDelete ? (
            <>
              <Text style={sheet.confirmText}>Delete this promise? This can't be undone.</Text>
              <View style={sheet.btnRow}>
                <TouchableOpacity style={sheet.cancelBtn} onPress={() => setConfirmDelete(false)}>
                  <Text style={sheet.cancelBtnText}>Keep it</Text>
                </TouchableOpacity>
                <TouchableOpacity style={sheet.deleteConfirmBtn} onPress={onDelete}>
                  <Text style={sheet.deleteConfirmText}>Yes, delete</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {promise.status !== 'kept' && (
                <TouchableOpacity style={sheet.actionBtn} onPress={onMarkDone}>
                  <Text style={sheet.actionIcon}>✅</Text>
                  <View><Text style={sheet.actionLabel}>Mark as done</Text><Text style={sheet.actionSub}>Grade how it went</Text></View>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={sheet.actionBtn} onPress={onEdit}>
                <Text style={sheet.actionIcon}>✏️</Text>
                <View><Text style={sheet.actionLabel}>Edit promise</Text><Text style={sheet.actionSub}>Change text, urgency or deadline</Text></View>
              </TouchableOpacity>
              <TouchableOpacity style={[sheet.actionBtn, sheet.actionBtnLast]} onPress={() => setConfirmDelete(true)}>
                <Text style={sheet.actionIcon}>🗑</Text>
                <View><Text style={[sheet.actionLabel, sheet.deleteLabel]}>Delete</Text><Text style={sheet.actionSub}>Remove permanently</Text></View>
              </TouchableOpacity>
              <TouchableOpacity style={sheet.closeBtn} onPress={onClose}>
                <Text style={sheet.closeBtnText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </BlurView>
      </View>
    </Modal>
  );
}

// ── Promise card ───────────────────────────────────────────────────────────
function PromiseCard({ promise, onPress, onLongPress, selectMode, selected, onToggleSelect }: {
  promise: BwmPromise; onPress: () => void; onLongPress: () => void;
  selectMode: boolean; selected: boolean; onToggleSelect: () => void;
}) {
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
  } else if (promise.fuzzyDeadline === 'this-week') { deadlineLabel = 'This week';
  } else if (promise.fuzzyDeadline === 'this-month') { deadlineLabel = 'This month'; }

  let keptLabel: string | null = null;
  if (isKept && promise.keptAt) {
    const d = new Date(promise.keptAt);
    keptLabel = `✅ Done ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
  }

  const bearScore  = promise.scoreHowWell ?? 0;
  const heartScore = promise.scoreHowFelt ?? 0;

  return (
    <TouchableOpacity
      style={[styles.card, isKept && styles.cardDone, selected && styles.cardSelected]}
      onPress={selectMode ? onToggleSelect : onPress}
      onLongPress={selectMode ? undefined : onLongPress}
      delayLongPress={350} activeOpacity={0.75}
    >
      {selectMode && (
        <View style={[styles.selectBox, selected && styles.selectBoxChecked]}>
          {selected && <Text style={styles.selectCheck}>✓</Text>}
        </View>
      )}
      <View style={[styles.cardStripe, { backgroundColor: stripeColor }]} />
      <View style={styles.cardInner}>
        <View style={styles.cardTop}>
          <Text style={[styles.cardTitle, isKept && styles.cardTitleDone]} numberOfLines={2}>{promise.text}</Text>
          <Text style={[styles.cardFlames, flameFaded && styles.cardFlamesFaded]}>{flames}</Text>
        </View>
        {!!promise.context && !isKept && <Text style={styles.cardNote} numberOfLines={1}>{promise.context}</Text>}
        <View style={[styles.cardMeta, (!!promise.context || isKept) && styles.cardMetaTopMargin]}>
          {!isKept && (
            <>
              {!!deadlineLabel && (
                <View style={styles.cardMetaItem}>
                  {status === 'overdue' ? <ClockIcon /> : <MetaCalendarIcon />}
                  <Text style={[styles.cardMetaText, status === 'overdue' && styles.cardDeadlineOverdue]}>{deadlineLabel}</Text>
                </View>
              )}
              {!!promise.toWhom && (
                <View style={styles.cardMetaItem}>
                  <PersonIcon /><Text style={styles.cardMetaText}>{promise.toWhom}</Text>
                </View>
              )}
            </>
          )}
          {isKept && (
            <>
              {!!keptLabel && <Text style={styles.keptLabel}>{keptLabel}</Text>}
              <View style={styles.likertGroup}>
                <View style={styles.likertRow}>
                  {[1,2,3,4,5].map(n => <Text key={n} style={[styles.likertEmoji, n > bearScore && styles.likertFaded]}>🐻</Text>)}
                </View>
                <View style={styles.likertRow}>
                  {[1,2,3,4,5].map(n => <Text key={n} style={[styles.likertEmoji, n > heartScore && styles.likertFaded]}>❤️</Text>)}
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Section header ─────────────────────────────────────────────────────────
function SectionHeader({ title, count, sorted, collapsed, onToggleSort, onToggleCollapse }: {
  title: string; count: number; sorted: boolean; collapsed: boolean;
  onToggleSort: () => void; onToggleCollapse: () => void;
}) {
  if (count === 0) return null;
  return (
    <TouchableOpacity style={styles.sectionLabel} onPress={onToggleCollapse} activeOpacity={0.7}>
      <Text style={styles.sectionLabelText}>{title}</Text>
      <View style={styles.sectionPill}><Text style={styles.sectionPillText}>{count}</Text></View>
      <Text style={styles.collapseChevron}>{collapsed ? '›' : '⌄'}</Text>
      {!collapsed && (
        <TouchableOpacity
          style={[styles.sortBtn, sorted && styles.sortBtnActive]}
          onPress={e => { e.stopPropagation?.(); onToggleSort(); }}
          activeOpacity={0.75} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.sortBtnText, sorted && styles.sortBtnTextActive]}>
            {sorted ? '🔥 sorted' : '🔥 sort'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ── Section ────────────────────────────────────────────────────────────────
function Section({ title, sectionKey, items, sorted, collapsed, selectMode, selected, onToggleSort, onToggleCollapse, onPress, onLongPress, onToggleSelect }: {
  title: string; sectionKey: string; items: BwmPromise[]; sorted: boolean; collapsed: boolean;
  selectMode: boolean; selected: string[];
  onToggleSort: () => void; onToggleCollapse: () => void;
  onPress: (id: string) => void; onLongPress: (p: BwmPromise) => void; onToggleSelect: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <View style={styles.group}>
      <SectionHeader title={title} count={items.length} sorted={sorted} collapsed={collapsed}
        onToggleSort={onToggleSort} onToggleCollapse={onToggleCollapse} />
      {!collapsed && items.map(p => (
        <PromiseCard key={p.id} promise={p}
          onPress={() => onPress(p.id)} onLongPress={() => onLongPress(p)}
          selectMode={selectMode} selected={selected.includes(p.id)}
          onToggleSelect={() => onToggleSelect(p.id)} />
      ))}
    </View>
  );
}

// ── Home screen ────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { promises, deletePromise } = usePromises();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const groups       = useMemo(() => groupPromises(promises), [promises]);
  const pendingCount = useMemo(() => promises.filter(p => p.status === 'pending').length, [promises]);
  const overdueCount = groups.overdue.length;
  const hasPromises  = promises.length > 0;
  const fabBottom    = useMemo(() => 60 + insets.bottom + 12, [insets.bottom]);

  const [showLogoEgg,       setShowLogoEgg]       = useState(false);
  const [activePromise,     setActivePromise]      = useState<BwmPromise | null>(null);
  const [urgencyFilter,     setUrgencyFilter]      = useState<number[]>([]);
  const [sortedSections,    setSortedSections]     = useState<string[]>([]);
  const [collapsedSections, setCollapsedSections]  = useState<string[]>([]);
  const [searchActive,      setSearchActive]       = useState(false);
  const [searchQuery,       setSearchQuery]        = useState('');
  const [selectMode,        setSelectMode]         = useState(false);
  const [selectedIds,       setSelectedIds]        = useState<string[]>([]);
  const [confirmBulk,       setConfirmBulk]        = useState(false);

  const handleLogoLongPress = useCallback(() => setShowLogoEgg(true), []);

  const toggleSort     = useCallback((s: string) => setSortedSections(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]), []);
  const toggleCollapse = useCallback((s: string) => setCollapsedSections(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]), []);
  const toggleFilter   = useCallback((u: number) => setUrgencyFilter(p => p.includes(u) ? p.filter(x => x !== u) : [...p, u]), []);
  const toggleSelect   = useCallback((id: string) => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]), []);

  const exitSelectMode = useCallback(() => { setSelectMode(false); setSelectedIds([]); setConfirmBulk(false); }, []);

  const handleBulkDelete = useCallback(() => {
    selectedIds.forEach(id => deletePromise(id));
    exitSelectMode();
  }, [selectedIds, deletePromise, exitSelectMode]);

  const filteredGroups = useMemo(() => {
    const byUrgencyDesc = (a: BwmPromise, b: BwmPromise) => b.urgency - a.urgency;
    const maybeSort = (items: BwmPromise[], key: string) =>
      sortedSections.includes(key) ? [...items].sort(byUrgencyDesc) : items;
    const q = searchQuery.trim().toLowerCase();
    const ok = (p: BwmPromise) =>
      (urgencyFilter.length === 0 || urgencyFilter.includes(p.urgency)) &&
      (!q || p.text.toLowerCase().includes(q) || (p.context ?? '').toLowerCase().includes(q) || (p.toWhom ?? '').toLowerCase().includes(q));
    return {
      overdue:  maybeSort(groups.overdue.filter(ok),  'overdue'),
      thisWeek: maybeSort(groups.thisWeek.filter(ok), 'thisWeek'),
      upcoming: maybeSort(groups.upcoming.filter(ok), 'upcoming'),
      kept:     maybeSort(groups.kept.filter(ok),     'kept'),
    };
  }, [groups, urgencyFilter, sortedSections, searchQuery]);

  const pushAdd   = useCallback(() => router.push('/modals/add-promise'), [router]);
  const pushGrade = useCallback((id: string) => router.push(`/modals/grade-promise?id=${id}`), [router]);

  const handleMarkDone = useCallback(() => {
    if (!activePromise) return;
    const id = activePromise.id; setActivePromise(null);
    setTimeout(() => router.push(`/modals/grade-promise?id=${id}`), 50);
  }, [activePromise, router]);

  const handleEdit = useCallback(() => {
    if (!activePromise) return;
    const id = activePromise.id; setActivePromise(null);
    setTimeout(() => router.push(`/modals/add-promise?id=${id}`), 50);
  }, [activePromise, router]);

  const handleDelete = useCallback(() => {
    if (!activePromise) return;
    deletePromise(activePromise.id); setActivePromise(null);
  }, [activePromise, deletePromise]);

  const sp = (key: string) => ({
    sorted: sortedSections.includes(key), collapsed: collapsedSections.includes(key),
    selectMode, selected: selectedIds,
    onToggleSort: () => toggleSort(key), onToggleCollapse: () => toggleCollapse(key),
    onToggleSelect: toggleSelect,
  });

  return (
    <View style={styles.root}>

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
        <BlurView intensity={60} tint="light" style={styles.header}>
          {selectMode ? (
            <>
              <TouchableOpacity style={styles.iconBtn} onPress={exitSelectMode}>
                <XIcon color={COLOURS.coffee1} />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.headerDate}>{selectedIds.length} selected</Text>
              </View>
              {selectedIds.length > 0 ? (
                confirmBulk ? (
                  <View style={styles.bulkConfirm}>
                    <TouchableOpacity style={styles.bulkKeepBtn} onPress={() => setConfirmBulk(false)}>
                      <Text style={styles.bulkKeepText}>Keep</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bulkDeleteBtn} onPress={handleBulkDelete}>
                      <Text style={styles.bulkDeleteText}>Delete {selectedIds.length}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={[styles.iconBtn, styles.iconBtnAlert]} onPress={() => setConfirmBulk(true)}>
                    <TrashIcon color={COLOURS.alert} />
                  </TouchableOpacity>
                )
              ) : <View style={styles.iconBtn} />}
            </>
          ) : searchActive ? (
            <>
              <TextInput
                style={styles.searchInput} placeholder="Search promises…"
                placeholderTextColor={COLOURS.textMuted} selectionColor={COLOURS.coffee2}
                value={searchQuery} onChangeText={setSearchQuery} autoFocus
              />
              <TouchableOpacity style={styles.iconBtn} onPress={() => { setSearchActive(false); setSearchQuery(''); }}>
                <XIcon color={COLOURS.coffee1} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.logoBlock}>
                <TouchableOpacity onLongPress={handleLogoLongPress} delayLongPress={800} activeOpacity={0.8}>
                  <Text style={styles.bear}>🐻</Text>
                </TouchableOpacity>
                <View style={styles.titleSub}>
                  <View style={styles.checkbox}><Text style={styles.checkmark}>✓</Text></View>
                  <Text style={styles.withMe}>with me</Text>
                </View>
              </View>
              <View style={styles.headerCenter}>
                <Text style={styles.headerDate}>
                  {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })}
                </Text>
                <Text style={styles.headerSub}>{pendingCount} promises · {overdueCount} overdue</Text>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => setSearchActive(true)}>
                  <SearchIcon color={COLOURS.coffee1} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => { setSelectMode(true); setSelectedIds([]); }}>
                  <TrashIcon color={COLOURS.coffee1} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </BlurView>

        <ScrollView style={styles.main} contentContainerStyle={styles.mainContent} showsVerticalScrollIndicator={false}>
          {!hasPromises ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyCard}>
                <Text style={styles.emptyBear}>🐻</Text>
                <Text style={styles.emptyTitle}>No promises yet</Text>
                <Text style={styles.emptySub}>{'Tap + to log your first promise.\nYou said you would. Bear with me.'}</Text>
              </View>
            </View>
          ) : (
            <>
              {!searchActive && (
                <View style={styles.filterRow}>
                  {([0, 1, 2, 3] as const).map(u => {
                    const active = urgencyFilter.includes(u);
                    return (
                      <TouchableOpacity key={u}
                        style={[styles.filterChip, active && styles.filterChipActive]}
                        onPress={() => toggleFilter(u)} activeOpacity={0.75}
                      >
                        <Text style={[styles.filterFlame, u === 0 && !active && styles.filterFlameFaded]}>
                          {FLAME_MAP[u]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              <Section key={`overdue-${sortedSections.includes('overdue')}`}
                title="Overdue" sectionKey="overdue" items={filteredGroups.overdue}
                onPress={pushGrade} onLongPress={setActivePromise} {...sp('overdue')} />
              <Section key={`thisWeek-${sortedSections.includes('thisWeek')}`}
                title="This week" sectionKey="thisWeek" items={filteredGroups.thisWeek}
                onPress={pushGrade} onLongPress={setActivePromise} {...sp('thisWeek')} />
              <Section key={`upcoming-${sortedSections.includes('upcoming')}`}
                title="Upcoming" sectionKey="upcoming" items={filteredGroups.upcoming}
                onPress={pushGrade} onLongPress={setActivePromise} {...sp('upcoming')} />
              <Section key={`kept-${sortedSections.includes('kept')}`}
                title="Recently kept" sectionKey="kept" items={filteredGroups.kept}
                onPress={() => {}} onLongPress={setActivePromise} {...sp('kept')} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Easter egg */}
      {showLogoEgg && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowLogoEgg(false)}>
          <TouchableOpacity style={egg.backdrop} activeOpacity={1} onPress={() => setShowLogoEgg(false)}>
            <View style={egg.card}>
              <Text style={egg.bear}>🐻</Text>
              <Text style={egg.title}>Hey, you found me.</Text>
              <Text style={egg.body}>{EGG_TEXT}</Text>
              <TouchableOpacity style={egg.btn} onPress={() => setShowLogoEgg(false)}>
                <Text style={egg.btnText}>Thanks, bear 🐻</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {activePromise && !selectMode && (
        <CardActionSheet
          promise={activePromise}
          onClose={() => setActivePromise(null)}
          onMarkDone={handleMarkDone}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {!selectMode && (
        <TouchableOpacity style={[styles.fab, { bottom: fabBottom }]} onPress={pushAdd} activeOpacity={0.85}>
          <Text style={styles.fabPlus}>+</Text>
        </TouchableOpacity>
      )}
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
  logoBlock: { alignItems: 'center', gap: 2, flexShrink: 0 },
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
  headerDate:   { fontFamily: FONTS.body, fontSize: SIZES.bodySmall, fontWeight: '600', color: COLOURS.textMuted },
  headerSub:    { fontFamily: FONTS.body, fontSize: SIZES.label, color: COLOURS.textDim, marginTop: 2 },
  headerRight:  { flexDirection: 'row', gap: 7 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: COLOURS.glass, borderWidth: 1, borderColor: COLOURS.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnAlert: { borderColor: COLOURS.alert },
  searchInput: {
    flex: 1, marginRight: 10, paddingVertical: 9, paddingHorizontal: 14,
    backgroundColor: COLOURS.glass, borderWidth: 1, borderColor: COLOURS.glassBorder,
    borderRadius: 12, fontFamily: FONTS.body, fontSize: SIZES.bodySmall, color: COLOURS.text,
  },
  bulkConfirm:    { flexDirection: 'row', gap: 8 },
  bulkKeepBtn:    { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: COLOURS.glass, borderWidth: 1, borderColor: COLOURS.glassBorder, borderRadius: 12 },
  bulkKeepText:   { fontFamily: FONTS.bodyBold, fontSize: SIZES.label, color: COLOURS.textMuted },
  bulkDeleteBtn:  { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: COLOURS.alert, borderRadius: 12 },
  bulkDeleteText: { fontFamily: FONTS.bodyBold, fontSize: SIZES.label, color: '#fff' },
  cardSelected:   { opacity: 1, borderColor: COLOURS.alert },
  selectBox: {
    width: 22, height: 22, borderRadius: 6, margin: 12,
    borderWidth: 2, borderColor: COLOURS.textDim,
    alignSelf: 'center', alignItems: 'center', justifyContent: 'center',
  },
  selectBoxChecked: { backgroundColor: COLOURS.alert, borderColor: COLOURS.alert },
  selectCheck:      { color: '#fff', fontSize: 13, fontWeight: '700' },
  main:        { flex: 1, paddingHorizontal: 14, paddingTop: 12 },
  mainContent: { paddingBottom: 140 },
  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32, gap: 20 },
  emptyBear:  { fontSize: 64 },
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.80)',
    borderRadius: 28, padding: 28, alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.90)',
    shadowColor: '#6F4E37', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, shadowRadius: 18, elevation: 8,
    width: '100%', gap: 10,
  },
  emptyTitle: { fontFamily: FONTS.heading, fontSize: SIZES.cardTitle, color: COLOURS.text },
  emptySub:   { fontFamily: FONTS.body, fontSize: SIZES.body, color: COLOURS.textMuted, textAlign: 'center', lineHeight: 24 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterChip: {
    paddingVertical: 8, paddingHorizontal: 14,
    backgroundColor: COLOURS.glass, borderWidth: 1, borderColor: COLOURS.glassBorder, borderRadius: 30,
    shadowColor: '#6F4E37', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  filterChipActive: { backgroundColor: 'rgba(166,123,91,0.28)' },
  filterFlame:      { fontSize: SIZES.label },
  filterFlameFaded: { opacity: 0.30 },
  group:        { marginBottom: 16 },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionLabelText: {
    fontFamily: FONTS.body, fontSize: SIZES.label, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.9, color: COLOURS.coffee2,
  },
  sectionPill: {
    backgroundColor: COLOURS.glass, borderWidth: 1, borderColor: COLOURS.glassBorder,
    borderRadius: 20, paddingHorizontal: 9, paddingVertical: 2,
  },
  sectionPillText:  { fontFamily: FONTS.body, fontSize: SIZES.label, fontWeight: '700', color: COLOURS.textMuted },
  collapseChevron:  { fontSize: SIZES.cardTitle, fontWeight: '700', color: COLOURS.coffee1, marginLeft: 2, lineHeight: SIZES.cardTitle },
  sortBtn: {
    marginLeft: 'auto', paddingVertical: 3, paddingHorizontal: 9,
    backgroundColor: COLOURS.glass, borderWidth: 1, borderColor: COLOURS.glassBorder, borderRadius: 20,
  },
  sortBtnActive:     { backgroundColor: 'rgba(166,123,91,0.28)' },
  sortBtnText:       { fontFamily: FONTS.body, fontSize: SIZES.label, color: COLOURS.textMuted },
  sortBtnTextActive: { color: COLOURS.coffee1, fontWeight: '700' },
  card: {
    flexDirection: 'row', backgroundColor: COLOURS.entryBg,
    borderWidth: 1, borderColor: COLOURS.glassBorder,
    borderRadius: RADIUS.card, marginBottom: 8, overflow: 'hidden',
    shadowColor: '#6F4E37', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 3,
  },
  cardDone:            { opacity: 0.68 },
  cardStripe:          { width: 5 },
  cardInner:           { flex: 1, paddingVertical: 13, paddingHorizontal: 14, paddingBottom: 11 },
  cardTop:             { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 },
  cardTitle:           { fontFamily: FONTS.body, fontSize: SIZES.body, fontWeight: '500', color: COLOURS.text, lineHeight: 26, flex: 1 },
  cardTitleDone:       { textDecorationLine: 'line-through', color: COLOURS.textMuted },
  cardFlames:          { fontSize: SIZES.body, lineHeight: 22, letterSpacing: -1, flexShrink: 0, paddingTop: 2 },
  cardFlamesFaded:     { opacity: 0.25 },
  cardNote:            { fontFamily: FONTS.bodyItalic, fontSize: SIZES.bodySmall, color: COLOURS.textMuted, lineHeight: 22, paddingLeft: 6, borderLeftWidth: 2, borderLeftColor: COLOURS.glassBorder },
  cardMeta:            { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  cardMetaTopMargin:   { marginTop: 8 },
  cardMetaItem:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText:        { fontFamily: FONTS.body, fontSize: SIZES.bodySmall, color: COLOURS.textMuted },
  cardDeadlineOverdue: { color: COLOURS.alert, fontWeight: '600', fontSize: SIZES.bodySmall },
  keptLabel:           { fontFamily: FONTS.body, fontSize: SIZES.bodySmall, fontWeight: '600', color: COLOURS.done },
  likertGroup:         { flexDirection: 'column', gap: 2, marginLeft: 'auto' },
  likertRow:           { flexDirection: 'row', gap: 2 },
  likertEmoji:         { fontSize: SIZES.bodySmall },
  likertFaded:         { opacity: 0.22 },
  fab: {
    position: 'absolute', right: 16,
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: COLOURS.coffee1, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLOURS.coffee1, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 18, elevation: 6,
  },
  fabPlus: { color: '#fff', fontSize: 30, lineHeight: 34 },
});

// ── Action sheet styles ────────────────────────────────────────────────────
const sheet = StyleSheet.create({
  modalRoot:   { flex: 1, justifyContent: 'flex-end' },
  dismissArea: { flex: 1 },
  container: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1.5, borderTopColor: 'rgba(255,255,255,0.80)',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 40,
    shadowColor: '#2C1A0E', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 12,
  },
  promiseText:       { fontFamily: FONTS.bodyItalic, fontSize: SIZES.bodySmall, color: COLOURS.textMuted, marginBottom: 8, paddingHorizontal: 4, lineHeight: 22 },
  actionBtn:         { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLOURS.glassBorder },
  actionBtnLast:     { borderBottomWidth: 0 },
  actionIcon:        { fontSize: 22, width: 32, textAlign: 'center' },
  actionLabel:       { fontFamily: FONTS.bodyBold, fontSize: SIZES.body, color: COLOURS.text },
  deleteLabel:       { color: COLOURS.alert },
  actionSub:         { fontFamily: FONTS.body, fontSize: SIZES.label, color: COLOURS.textMuted, marginTop: 2 },
  closeBtn:          { marginTop: 14, paddingVertical: 15, backgroundColor: MODAL_CHIP_BG, borderRadius: RADIUS.pill, alignItems: 'center', ...MODAL_CHIP_SHADOW },
  closeBtnText:      { fontFamily: FONTS.bodyBold, fontSize: SIZES.body, color: COLOURS.textMuted },
  confirmText:       { fontFamily: FONTS.body, fontSize: SIZES.body, color: COLOURS.text, lineHeight: 26, marginBottom: 20 },
  btnRow:            { flexDirection: 'row', gap: 12 },
  cancelBtn:         { flex: 1, paddingVertical: 15, alignItems: 'center', backgroundColor: MODAL_CHIP_BG, borderRadius: RADIUS.pill, ...MODAL_CHIP_SHADOW },
  cancelBtnText:     { fontFamily: FONTS.bodyBold, fontSize: SIZES.body, color: COLOURS.textMuted },
  deleteConfirmBtn:  { flex: 1, paddingVertical: 15, alignItems: 'center', backgroundColor: COLOURS.alert, borderRadius: RADIUS.pill },
  deleteConfirmText: { fontFamily: FONTS.bodyBold, fontSize: SIZES.body, color: '#fff' },
});

// ── Easter egg styles ─────────────────────────────────────────────────────
const egg = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(44,26,14,0.55)',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.80)', borderRadius: 28, padding: 28, alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.90)',
    shadowColor: '#6F4E37', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 8,
    width: '100%',
  },
  bear:  { fontSize: 64, marginBottom: 12 },
  title: { fontFamily: FONTS.headingItalic, fontSize: SIZES.screenTitle, color: COLOURS.text, marginBottom: 14, textAlign: 'center' },
  body:  { fontFamily: FONTS.body, fontSize: SIZES.bodySmall, color: COLOURS.textMuted, lineHeight: 26, textAlign: 'center', marginBottom: 28 },
  btn: {
    alignSelf: 'stretch', paddingVertical: 16, alignItems: 'center',
    backgroundColor: MODAL_CHIP_BG, borderRadius: 20,
    shadowColor: '#6F4E37', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 18, elevation: 8,
  },
  btnText: { fontFamily: FONTS.bodyBold, fontSize: SIZES.body, color: COLOURS.coffee1 },
});
