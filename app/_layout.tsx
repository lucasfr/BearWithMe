/**
 * app/_layout.tsx — Root layout
 */
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Circle, Rect, Pattern, Defs } from 'react-native-svg';
import * as SplashScreen from 'expo-splash-screen';
import { PromisesProvider } from '../storage/PromisesContext';
import { COLOURS } from '../theme/colours';
import { FONTS } from '../theme/typography';

// Keep the native splash visible until we're ready
SplashScreen.preventAutoHideAsync();

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

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      // Keep splash visible for at least 2s
      const t = setTimeout(() => setReady(true), 2000);
      return () => clearTimeout(t);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded || !ready) return <CustomSplash />;

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

function CustomSplash() {
  return (
    <View style={splash.root}>
      {/* Dot grid */}
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

      {/* Bear */}
      <Text style={splash.bear}>🐻</Text>

      {/* Checkbox + with me */}
      <View style={splash.row}>
        <View style={splash.checkbox}>
          <Text style={splash.check}>✓</Text>
        </View>
        <Text style={splash.withMe}>with me</Text>
      </View>
    </View>
  );
}

const splash = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLOURS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  bear: {
    fontSize: 120,
    lineHeight: 130,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: COLOURS.coffee1,
    alignItems: 'center', justifyContent: 'center',
  },
  check: {
    color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 24,
  },
  withMe: {
    fontSize: 36,
    fontStyle: 'italic',
    color: COLOURS.coffee2,
    textDecorationLine: 'line-through',
  },
});
