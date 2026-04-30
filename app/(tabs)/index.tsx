import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { usePromises } from '../../storage/PromisesContext';
import { groupPromises } from '../../utils/promise';
import { COLOURS } from '../../theme/colours';
import { FONTS, SIZES } from '../../theme/typography';

export default function HomeScreen() {
  const { promises } = usePromises();
  const router = useRouter();
  const groups = groupPromises(promises);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.logoBlock}>
          <Text style={styles.bear}>🐻</Text>
          <View style={styles.titleSub}>
            <View style={styles.checkbox}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
            <Text style={styles.withMe}>with me</Text>
          </View>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })}
          </Text>
          <Text style={styles.headerSub}>
            {promises.filter(p => p.status === 'pending').length} promises ·{' '}
            {groups.overdue.length} overdue
          </Text>
        </View>
      </View>

      <ScrollView style={styles.main} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.placeholder}>
          Your promises will appear here.{'\n'}Tap + to add your first one.
        </Text>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
    backgroundColor: COLOURS.headerBg,
    borderBottomWidth: 1, borderBottomColor: COLOURS.glassBorder,
  },
  logoBlock: { alignItems: 'center', gap: 2 },
  bear: { fontSize: 36 },
  titleSub: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  checkbox: { width: 16, height: 16, borderRadius: 4, backgroundColor: COLOURS.coffee1, alignItems: 'center', justifyContent: 'center' },
  checkmark: { color: '#fff', fontSize: 11, fontWeight: '700' },
  withMe: { fontFamily: FONTS.headingItalic, fontSize: 17, color: COLOURS.coffee2, textDecorationLine: 'line-through' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerDate: { fontFamily: FONTS.body, fontSize: 14, fontWeight: '600', color: COLOURS.textMuted },
  headerSub: { fontFamily: FONTS.body, fontSize: 12, color: COLOURS.textDim, marginTop: 2 },
  main: { flex: 1, padding: 14 },
  placeholder: { fontFamily: FONTS.body, fontSize: SIZES.body, color: COLOURS.textMuted, textAlign: 'center', marginTop: 60, lineHeight: 26 },
  fab: {
    position: 'absolute', bottom: 90, right: 18,
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: COLOURS.coffee1,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLOURS.coffee1, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 30, lineHeight: 34 },
});
