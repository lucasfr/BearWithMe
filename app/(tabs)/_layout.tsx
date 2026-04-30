import { Tabs } from 'expo-router';
import { COLOURS } from '../../theme/colours';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLOURS.headerBg,
          borderTopColor: COLOURS.glassBorder,
        },
        tabBarActiveTintColor:   COLOURS.coffee1,
        tabBarInactiveTintColor: COLOURS.textDim,
      }}
    >
      <Tabs.Screen name="index"    options={{ tabBarLabel: 'Home' }} />
      <Tabs.Screen name="calendar" options={{ tabBarLabel: 'Calendar' }} />
      <Tabs.Screen name="report"   options={{ tabBarLabel: 'Report' }} />
      <Tabs.Screen name="profile"  options={{ tabBarLabel: 'Profile' }} />
    </Tabs>
  );
}
