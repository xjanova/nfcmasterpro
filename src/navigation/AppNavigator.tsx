import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList, BottomTabParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Spacing, Radius, Shadow, FontSizes } from '../utils/theme';

// Screens
import SplashScreen from '../screens/SplashScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CardsScreen from '../screens/CardsScreen';
import CardDetailScreen from '../screens/CardDetailScreen';
import MemberDetailScreen from '../screens/MemberDetailScreen';
import MemberRegisterScreen from '../screens/MemberRegisterScreen';
import DigitalBusinessCardScreen from '../screens/DigitalBusinessCardScreen';
import PaymentResultScreen from '../screens/PaymentResultScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import ReadNFCScreen from '../screens/ReadNFCScreen';
import WriteNFCScreen from '../screens/WriteNFCScreen';
import CloneNFCScreen from '../screens/CloneNFCScreen';
import HexViewScreen from '../screens/HexViewScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import MembersScreen from '../screens/MembersScreen';
import PaymentScreen from '../screens/PaymentScreen';
import SettingsScreen from '../screens/SettingsScreen';
import QRScannerScreen from '../screens/QRScannerScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

// ============================================================
//  Tab Icon Component — clean monochrome design
// ============================================================

const tabConfig: { [key: string]: { icon: string; activeIcon: string; label: string } } = {
  Dashboard: { icon: '○', activeIcon: '●', label: 'Home' },
  Cards: { icon: '▯', activeIcon: '▮', label: 'Cards' },
  Members: { icon: '◎', activeIcon: '◉', label: 'Members' },
  Payment: { icon: '◇', activeIcon: '◆', label: 'Pay' },
  Settings: { icon: '☰', activeIcon: '☰', label: 'Settings' },
};

function TabBarIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const { colors } = useTheme();
  const config = tabConfig[name] || { icon: '●', activeIcon: '●', label: name };

  return (
    <View style={[
      iconStyles.container,
      focused && [iconStyles.containerActive, { backgroundColor: colors.primaryGlow }],
    ]}>
      <Text style={[iconStyles.icon, { color }]}>
        {focused ? config.activeIcon : config.icon}
      </Text>
    </View>
  );
}

const iconStyles = StyleSheet.create({
  container: {
    width: 48,
    height: 32,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerActive: {
    transform: [{ scale: 1.05 }],
  },
  icon: {
    fontSize: 18,
    fontWeight: '700',
  },
});

// ============================================================
//  Bottom Tab Navigator — Floating glass design
// ============================================================

function MainTabs() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Ensure floating above Android navigation bar
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: bottomPadding + 8,
          left: 16,
          right: 16,
          height: 64,
          backgroundColor: colors.tabBarBg,
          borderRadius: Radius.xxl,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colors.border,
          paddingBottom: 0,
          paddingTop: 6,
          ...Shadow.lg,
          elevation: 12,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 6,
        },
        tabBarIcon: ({ focused, color }) => (
          <TabBarIcon name={route.name} focused={focused} color={color} />
        ),
      })}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Cards"
        component={CardsScreen}
        options={{ tabBarLabel: 'Cards' }}
      />
      <Tab.Screen
        name="Members"
        component={MembersScreen}
        options={{ tabBarLabel: 'Members' }}
      />
      <Tab.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ tabBarLabel: 'Pay' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

// ============================================================
//  Root Stack Navigator
// ============================================================

export default function AppNavigator() {
  const [showSplash, setShowSplash] = useState(true);
  const { colors } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <NavigationContainer>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.bg} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showSplash ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            {/* Modal Screens */}
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
              <Stack.Screen name="CardDetail" component={CardDetailScreen} />
              <Stack.Screen name="MemberDetail" component={MemberDetailScreen} />
              <Stack.Screen
                name="MemberRegister"
                component={MemberRegisterScreen}
              />
              <Stack.Screen
                name="DigitalBusinessCard"
                component={DigitalBusinessCardScreen}
              />
              <Stack.Screen name="PaymentResult" component={PaymentResultScreen} />
              <Stack.Screen
                name="TransactionHistory"
                component={TransactionHistoryScreen}
              />
              <Stack.Screen name="ReadNFC" component={ReadNFCScreen} />
              <Stack.Screen name="WriteNFC" component={WriteNFCScreen} />
              <Stack.Screen name="CloneNFC" component={CloneNFCScreen} />
              <Stack.Screen name="HexView" component={HexViewScreen} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} />
              <Stack.Screen name="QRScanner" component={QRScannerScreen} />
            </Stack.Group>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
