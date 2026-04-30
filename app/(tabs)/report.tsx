import { View, Text, StyleSheet } from 'react-native';
import { COLOURS } from '../../theme/colours';
import { FONTS, SIZES } from '../../theme/typography';
export default function ReportScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>My report</Text>
      <Text style={styles.sub}>Coming soon 📊</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLOURS.bg, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FONTS.headingItalic, fontSize: SIZES.screenTitle, color: COLOURS.text },
  sub: { fontFamily: FONTS.body, fontSize: SIZES.body, color: COLOURS.textMuted, marginTop: 8 },
});
