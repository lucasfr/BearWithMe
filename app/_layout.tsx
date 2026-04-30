/**
 * app/_layout.tsx — Root layout
 */
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { View, StyleSheet, Platform } from 'react-native';
import { PromisesProvider } from '../storage/PromisesContext';
import { COLOURS } from '../theme/colours';

import {
  LibreBaskerville_400Regular,
  LibreBaskerville_400Regular_Italic,
  LibreBaskerville_700Bold,
} from '@expo-google-fonts/libre-baskerville';

import {
  SourceSans3_400Regular,
  SourceSans3_400Regular_Italic,
  SourceSans3_700Bold,
} from '@expo-google-fonts/source-sans-3';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'LibreBaskerville':        LibreBaskerville_400Regular,
    'LibreBaskerville-Italic': LibreBaskerville_400Regular_Italic,
    'LibreBaskerville-Bold':   LibreBaskerville_700Bold,
    'SourceSans3':             SourceSans3_400Regular,
    'SourceSans3-Italic':      SourceSans3_400Regular_Italic,
    'SourceSans3-Bold':        SourceSans3_700Bold,
  });

  if (!fontsLoaded) return null;

  const content = (
    <PromisesProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="modals/add-promise"
          options={{
            presentation: 'transparentModal',
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen
          name="modals/grade-promise"
          options={{
            presentation: 'transparentModal',
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
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
