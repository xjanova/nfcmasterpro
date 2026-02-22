import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Colors, FontSizes, Spacing } from '../utils/theme';
import { APP_VERSION } from '../utils/constants';

interface SplashLogoProps {
  onComplete?: () => void;
}

const SplashLogo: React.FC<SplashLogoProps> = ({ onComplete }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulsing animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    // Fade in animation
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    pulseLoop.start();

    // Complete after 2 seconds
    const timer = setTimeout(() => {
      pulseLoop.stop();
      if (onComplete) {
        onComplete();
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      pulseLoop.stop();
    };
  }, [pulseAnim, opacityAnim, onComplete]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ scale: pulseAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <View style={styles.hexagon}>
          <Text style={styles.logoText}>X</Text>
        </View>
      </Animated.View>

      <Text style={styles.studioName}>xman studio</Text>

      <Text style={styles.version}>v{APP_VERSION}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
  },
  logoContainer: {
    marginBottom: Spacing.xxxl,
  },
  hexagon: {
    width: 120,
    height: 120,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
  },
  logoText: {
    fontSize: FontSizes.display,
    fontWeight: '900',
    color: Colors.text,
  },
  studioName: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.lg,
    letterSpacing: 1,
  },
  version: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    position: 'absolute',
    bottom: Spacing.xxxl,
  },
});

export default SplashLogo;
