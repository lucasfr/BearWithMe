import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemo } from 'react';
import { COLOURS } from '../../theme/colours';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

function HomeIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function CalendarTabIcon({ color, size }: { color: string; size: number }) {
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

// Stable module-level render functions — never recreated
const renderHome     = ({ color, size }: { color: string; size: number }) => <HomeIcon color={color} size={size} />;
const renderCalendar = ({ color, size }: { color: string; size: number }) => <CalendarTabIcon color={color} size={size} />;
const renderReport   = ({ color, size }: { color: string; size: number }) => <ReportIcon color={color} size={size} />;
const renderProfile  = ({ color, size }: { color: string; size: number }) => <ProfileIcon color={color} size={size} />;

// Stable per-screen options objects — never recreated
const homeOptions     = { tabBarLabel: 'Home',     tabBarIcon: renderHome };
const calendarOptions = { tabBarLabel: 'Calendar', tabBarIcon: renderCalendar };
const reportOptions   = { tabBarLabel: 'Report',   tabBarIcon: renderReport };
const profileOptions  = { tabBarLabel: 'Profile',  tabBarIcon: renderProfile };

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  // screenOptions is memoized — only changes when insets.bottom changes
  const screenOptions = useMemo(() => ({
    headerShown: false,
    tabBarStyle: {
      position: 'absolute' as const,
      backgroundColor: 'rgba(245,239,230,0.92)',
      borderTopWidth: 1,
      borderTopColor: COLOURS.glassBorder,
      height: 60 + insets.bottom,
      paddingBottom: insets.bottom,
      paddingTop: 8,
    },
    tabBarActiveTintColor:   COLOURS.coffee1,
    tabBarInactiveTintColor: COLOURS.textDim,
    tabBarLabelStyle: styles.tabLabel,
  }), [insets.bottom]);

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="index"    options={homeOptions} />
      <Tabs.Screen name="calendar" options={calendarOptions} />
      <Tabs.Screen name="report"   options={reportOptions} />
      <Tabs.Screen name="profile"  options={profileOptions} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontFamily: 'SourceSans3',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
