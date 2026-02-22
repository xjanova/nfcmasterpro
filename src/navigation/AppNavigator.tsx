import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList, BottomTabParamList } from '../types';
import { Colors } from '../utils/theme';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ReadScreen from '../screens/ReadScreen';
import WriteScreen from '../screens/WriteScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HexViewScreen from '../screens/HexViewScreen';
import MemberRegisterScreen from '../screens/MemberRegisterScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

// Clone Screen (simple wrapper)
import CloneScreen from '../screens/CloneScreen';

// ============================================================
//  Bottom Tab Navigator
// ============================================================

const tabIcons: { [key: string]: { active: string; inactive: string } } = {
  Home:     { active: '🏠', inactive: '🏠' },
  Read:     { active: '📡', inactive: '📡' },
  Write:    { active: '✏️', inactive: '✏️' },
  History:  { active: '📋', inactive: '📋' },
  Settings: { active: '⚙️', inactive: '⚙️' },
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <Text style={tabStyles.icon}>{tabIcons[name]?.active || '●'}</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: tabStyles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: tabStyles.tabLabel,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'หน้าหลัก' }} />
      <Tab.Screen name="Read" component={ReadScreen} options={{ tabBarLabel: 'อ่าน' }} />
      <Tab.Screen name="Write" component={WriteScreen} options={{ tabBarLabel: 'เขียน' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: 'ประวัติ' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'ตั้งค่า' }} />
    </Tab.Navigator>
  );
}

// ============================================================
//  Root Stack Navigator
// ============================================================

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="HexView" component={HexViewScreen} />
        <Stack.Screen name="MemberRegister" component={MemberRegisterScreen} />
        <Stack.Screen name="Clone" component={CloneScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const tabStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  iconWrap: {
    width: 36, height: 28, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(99,102,241,0.2)',
  },
  icon: { fontSize: 18 },
});
