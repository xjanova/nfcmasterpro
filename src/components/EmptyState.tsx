import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, FontSizes, Spacing, Radius, TextStyles } from '../utils/theme';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>

      <Text style={styles.title}>{title}</Text>

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      {actionLabel && onAction && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxxl,
    minHeight: 300,
  },
  icon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  title: {
    ...TextStyles.headingMedium,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...TextStyles.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    maxWidth: 300,
  },
  actionButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    marginTop: Spacing.lg,
  },
  actionText: {
    ...TextStyles.labelLarge,
    color: Colors.text,
    fontWeight: '600',
  },
});

export default EmptyState;
