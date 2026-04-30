import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePromises } from '../../storage/PromisesContext';
import { groupPromises } from '../../utils/promise';
import { COLOURS } from '../../theme/colours';
import { FONTS, SIZES } from '../../theme/typography';
import { BlurView } from 'expo-blur';

export default function HomeScreen() {
  const { promises } = usePromises();
  const router = useRouter();
  const groups = groupPromises(promises);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>

      {/* Glassy header */}
      <BlurView intensity={60} tint="light" style={[styles.header, { paddingTop: insets.top + 10 }]}>
        {/* Logo — fixed width so center stays centred */}
        <View style={styles.logoBlock}>
          <Text style={styles.bear}>🐻</Text>
          <View style={styles.titleSub}>
            <View style={styles.checkbox}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
            <Text style={styles.withMe}>with me</Text>
          </View>
        </View>

        {/* Centre — date + subtitle */}
        <View style={styles.headerCenter}>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })}
          </Text>
          <Text style={styles.headerSub}>
            {promises.filter(p => p.status === 'pending').length} promises · {groups.overdue.length} overdue
          </Text>
        </View>

        {/* Right spacer — same width as logo so centre is truly centred */}
        <View style={styles.logoBlock} />
      </BlurView>

      {/* Content */}
      <ScrollView
        style={styles.main}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Text style={styles.placeholder}>
          Your promises will appear here.{'\n'}Tap + to add your first one.
        </Text>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 80 + insets.bottom }]}
        onPress={() => router.push('/modals/add-promise')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLOURS.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLOURS.glassBorder,
    // fallback for platforms without blur
    backgroundColor: Platform.OS === 'android' ? COLOURS.headerBg : 'transparent',
  },

  logoBlock: {
    width: 72,
    alignItems: 'center',
    gap: 2,
  },
  bear: { fontSize: 34 },
  titleSub: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  checkbox: {
    width: 15, height: 15, borderRadius: 4,
    backgroundColor: COLOURS.coffee1,
    alignItems: 'center', justifyContent: 'center',
  },
  checkmark: { color: '#fff', fontSize: 10, fontWeight: '700' },
  withMe: {
    fontFamily: FONTS.headingItalic,
    fontSize: 16,
    color: COLOURS.coffee2,
    textDecorationLine: 'line-through',
  },

  headerCenter: { flex: 1, alignItems: 'center' },
  headerDate: {
    fontFamily: FONTS.body,
    fontSize: 14,
    fontWeight: '600',
    color: COLOURS.textMuted,
  },
  headerSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLOURS.textDim,
    marginTop: 2,
  },

  main: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  placeholder: {
    fontFamily: FONTS.body,
    fontSize: SIZES.body,
    color: COLOURS.textMuted,
    textAlign: 'center',
    marginTop: 60,
    lineHeight: 26,
  },

  fab: {
    position: 'absolute',
    right: 18,
    width: 56, height: 56,
    borderRadius: 18,
    backgroundColor: COLOURS.coffee1,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLOURS.coffee1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 30, lineHeight: 34 },
});
