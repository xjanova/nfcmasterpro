import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SplashLogo } from '../components';
import { Colors, Spacing } from '../utils/theme';
import { APP_VERSION } from '../utils/constants';

const { height } = Dimensions.get('window');

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('MainTabs');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Logo Section */}
      <View style={styles.logoSection}>
        <SplashLogo />
      </View>

      {/* Version Badge */}
      <View style={styles.versionSection}>
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>v{APP_VERSION}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  versionSection: {
    paddingBottom: Spacing.xxxl,
    alignItems: 'center',
  },
  versionBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  versionText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default SplashScreen;
