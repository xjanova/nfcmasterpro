import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CardStatus } from '../types';
import { Colors, FontSizes, Spacing, Radius } from '../utils/theme';
import { useLanguage } from '../utils/i18n';

interface StatusBadgeProps {
  status: CardStatus;
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const { t } = useLanguage();

  const statusConfig = {
    active: {
      color: Colors.success,
      label: t['cards.cardStatus.active'],
    },
    disabled: {
      color: Colors.danger,
      label: t['cards.cardStatus.disabled'],
    },
    lost: {
      color: Colors.textMuted,
      label: t['cards.cardStatus.lost'],
    },
  };

  const sizeConfig = {
    sm: {
      dotSize: 6,
      fontSize: FontSizes.xs,
      padding: Spacing.xs,
      gap: 4,
    },
    md: {
      dotSize: 8,
      fontSize: FontSizes.sm,
      padding: Spacing.sm,
      gap: Spacing.xs,
    },
    lg: {
      dotSize: 10,
      fontSize: FontSizes.md,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
  };

  const config = statusConfig[status];
  const sizeStyle = sizeConfig[size];

  return (
    <View
      style={[
        styles.badge,
        {
          paddingHorizontal: sizeStyle.padding,
          paddingVertical: sizeStyle.padding * 0.75,
          gap: sizeStyle.gap,
        },
      ]}
    >
      <View
        style={{
          width: sizeStyle.dotSize,
          height: sizeStyle.dotSize,
          borderRadius: sizeStyle.dotSize / 2,
          backgroundColor: config.color,
        }}
      />
      <Text style={[styles.label, { fontSize: sizeStyle.fontSize }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignSelf: 'flex-start',
  },
  label: {
    color: Colors.text,
    fontWeight: '600',
  },
});

export default StatusBadge;
