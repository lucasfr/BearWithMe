import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLOURS } from '../../theme/colours';

function TabIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, string> = {
    home:     'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    calendar: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .89-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.11-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5zm2 4h10v2H7zm0 4h7v2H7z',
    report:   'M5 9.2h3V19H5zm5.6-4.2h2.8v14h-2.8zm5.6 8h2.8v6h-2.8z',
    profile:  'M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z',
  };

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={color}>
      <path d={icons[name]} />
    </svg>
  );
}

// Simple path-based icon using Text with unicode symbols for RN compatibility
function Icon({ tab, color, size }: { tab: string; color: string; size: number }) {
  const map: Record<string, string> = {
    index:    '⌂',
    calendar: '◫',
    report:   '▦',
    profile:  '◯',
  };
  return null; // replaced below
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'rgba(245,239,230,0.92)',
          borderTopWidth: 1,
          borderTopColor: COLOURS.glassBorder,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor:   COLOURS.coffee1,
        tabBarInactiveTintColor: COLOURS.textDim,
        tabBarLabelStyle: {
          fontFamily: 'SourceSans3',
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ color, size }) => <CalendarIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          tabBarLabel: 'Report',
          tabBarIcon: ({ color, size }) => <ReportIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <ProfileIcon color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

import { View } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

function HomeIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function CalendarIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function ReportIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 20V10M12 20V4M6 20v-6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function ProfileIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M20 21a8 8 0 1 0-16 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
