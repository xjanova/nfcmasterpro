import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Gradient, Shadow, Spacing, Radius } from '../utils/theme';

interface GradientCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: 'primary' | 'secondary' | 'card' | 'premium';
  onPress?: () => void;
}

const GradientCard: React.FC<GradientCardProps> = ({
  children,
  style,
  gradient = 'card',
  onPress,
}) => {
  const gradientColors = {
    primary: Gradient.primary,
    secondary: Gradient.secondary,
    card: Gradient.card,
    premium: Gradient.premium,
  };

  const [startColor, endColor] = gradientColors[gradient];

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      style={[
        styles.container,
        {
          borderColor: gradient === 'premium' ? Colors.gold : startColor,
          shadowColor: gradient === 'premium' ? Colors.gold : startColor,
        },
        style,
      ]}
      activeOpacity={0.8}
    >
      <View style={[styles.innerContainer, { backgroundColor: Colors.card }]}>
        {children}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  innerContainer: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
});

export default GradientCard;
