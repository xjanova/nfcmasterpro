import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList, BottomTabParamList } from '../types';
import { Colors, Spacing, Radius } from '../utils/theme';

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

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

// ============================================================
//  Tab Icons Configuration
// ============================================================

const tabIcons: { [key: string]: string } = {
  Dashboard: '🏠',
  Cards: '💳',
  Members: '👤',
  Payment: '💰',
  Settings: '⚙️',
};

// ============================================================
//  Custom Tab Bar Component
// ============================================================

function TabBarIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Text style={styles.icon}>{tabIcons[name] || '●'}</Text>
    </View>
  );
}

// ============================================================
//  Bottom Tab Navigator
// ============================================================

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => (
          <TabBarIcon name={route.name} focused={focused} />
        ),
      })}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
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
        options={{ tabBarLabel: 'Payment' }}
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

  useEffect(() => {
    // Splash screen timer
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
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
            </Stack.Group>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ============================================================
//  Styles
// ============================================================

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 70,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  iconContainer: {
    width: 44,
    height: 36,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.3s',
  },
  iconContainerActive: {
    backgroundColor: `rgba(99, 102, 241, 0.2)`,
  },
  icon: {
    fontSize: 20,
  },
});
