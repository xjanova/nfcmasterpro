import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Gradient, Spacing, Radius, FontSizes, TextStyles } from '../utils/theme';

interface GradientCardProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  gradient?: 'primary' | 'secondary' | 'card' | 'premium';
  onPress?: () => void;
  // Stat card shortcut props
  icon?: string;
  value?: string;
  label?: string;
}

const GradientCard: React.FC<GradientCardProps> = ({
  children,
  style,
  gradient = 'card',
  onPress,
  icon,
  value,
  label,
}) => {
  const gradientColors = {
    primary: Gradient.primary,
    secondary: Gradient.secondary,
    card: Gradient.card,
    premium: Gradient.premium,
  };

  const [startColor] = gradientColors[gradient];

  const Container = onPress ? TouchableOpacity : View;

  // If icon/value/label props are provided, render stat card layout
  const content = icon || value || label ? (
    <View style={styles.statLayout}>
      {icon && <Text style={styles.statIcon}>{icon}</Text>}
      <View style={styles.statTextGroup}>
        {value && <Text style={styles.statValue} numberOfLines={1}>{value}</Text>}
        {label && <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>}
      </View>
    </View>
  ) : (
    children
  );

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
        {content}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    padding: 2,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  innerContainer: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  // Stat card styles
  statLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  statIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  statTextGroup: {
    flex: 1,
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
});

export default GradientCard;
