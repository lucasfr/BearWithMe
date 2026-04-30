/**
 * app/_layout.tsx — Root layout
 */
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { View, StyleSheet, Platform } from 'react-native';
import { PromisesProvider } from '../storage/PromisesContext';
import { COLOURS } from '../theme/colours';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'LibreBaskerville':        require('../assets/fonts/LibreBaskerville-Regular.ttf'),
    'LibreBaskerville-Italic': require('../assets/fonts/LibreBaskerville-Italic.ttf'),
    'SourceSans3':             require('../assets/fonts/SourceSans3-Regular.ttf'),
    'SourceSans3-Italic':      require('../assets/fonts/SourceSans3-Italic.ttf'),
  });

  if (!fontsLoaded) return null;

  const content = (
    <PromisesProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modals/add-promise"   options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="modals/grade-promise" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      </Stack>
    </PromisesProvider>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webOuter}>
        <View style={styles.webInner}>{content}</View>
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  webOuter: { flex: 1, backgroundColor: COLOURS.bg, alignItems: 'center' },
  webInner: { flex: 1, width: '100%', maxWidth: 480, overflow: 'hidden' },
});
