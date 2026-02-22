import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SplashLogo } from '../components';
import { useTheme } from '../context/ThemeContext';
import { Spacing } from '../utils/theme';
import { APP_VERSION } from '../utils/constants';

const SplashScreen: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.bg} />
      <View style={styles.logoSection}>
        <SplashLogo />
      </View>
      <View style={styles.versionSection}>
        <View style={[styles.versionBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.versionText}>v{APP_VERSION}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  versionSection: { paddingBottom: Spacing.xxxl, alignItems: 'center' },
  versionBadge: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: 20 },
  versionText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});

export default SplashScreen;
