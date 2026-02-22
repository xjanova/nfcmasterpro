import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CardInfo } from '../types';
import { Colors, FontSizes, Spacing, Radius, TextStyles } from '../utils/theme';

interface NFCCardVisualProps {
  card: CardInfo;
  memberName?: string;
  compact?: boolean;
}

const NFCCardVisual: React.FC<NFCCardVisualProps> = ({
  card,
  memberName,
  compact = false,
}) => {
  const statusColors = {
    active: Colors.success,
    disabled: Colors.danger,
    lost: Colors.textMuted,
  };

  const statusLabels = {
    active: 'Active',
    disabled: 'Disabled',
    lost: 'Lost',
  };

  const formatCardNumber = (uid: string): string => {
    // Format as: XXXX-XXXX-XXXX-XXXX
    const cleaned = uid.replace(/[:-]/g, '');
    return cleaned
      .substring(0, 16)
      .replace(/(.{4})/g, '$1-')
      .replace(/-$/, '');
  };

  if (compact) {
    return (
      <View style={[styles.cardCompact, { backgroundColor: Colors.card }]}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactCardNumber}>{formatCardNumber(card.uid)}</Text>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: statusColors[card.status] },
            ]}
          />
        </View>
        <Text style={styles.compactMemberName}>{memberName || card.memberName || 'N/A'}</Text>
        <Text style={styles.compactBalance}>{card.balance} ฿</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: Colors.card }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.chipLabel}>Chip</Text>
          <View style={styles.chipIcon}>
            <View style={styles.chipGridItem} />
            <View style={styles.chipGridItem} />
            <View style={styles.chipGridItem} />
            <View style={styles.chipGridItem} />
          </View>
        </View>
        <View style={styles.headerRight}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColors[card.status] },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: statusColors[card.status] },
              ]}
            />
            <Text style={styles.statusText}>{statusLabels[card.status]}</Text>
          </View>
        </View>
      </View>

      {/* Card Number */}
      <Text style={styles.cardNumber}>{formatCardNumber(card.uid)}</Text>

      {/* Member Name & Balance */}
      <View style={styles.middle}>
        <View style={styles.nameSection}>
          <Text style={styles.label}>CARDHOLDER</Text>
          <Text style={styles.memberName}>{memberName || card.memberName || 'N/A'}</Text>
        </View>
        <View style={styles.balanceSection}>
          <Text style={styles.label}>BALANCE</Text>
          <Text style={styles.balance}>{card.balance} ฿</Text>
        </View>
      </View>

      {/* PV Points */}
      <View style={styles.pvSection}>
        <Text style={styles.label}>PV POINTS</Text>
        <Text style={styles.pvPoints}>{card.pvPoints}</Text>
      </View>

      {/* Footer - Studio Watermark */}
      <View style={styles.footer}>
        <Text style={styles.watermark}>xman studio</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    aspectRatio: 1.586, // Credit card ratio (85.6mm x 54mm)
    minHeight: 280,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  chipLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  chipIcon: {
    width: 32,
    height: 32,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    padding: 4,
    backgroundColor: Colors.border,
    borderRadius: Radius.sm,
  },
  chipGridItem: {
    width: 6,
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  headerRight: {},
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: FontSizes.xs,
    color: Colors.text,
    fontWeight: '600',
  },
  cardNumber: {
    fontSize: FontSizes.lg,
    color: Colors.secondary,
    fontFamily: 'JetBrains Mono',
    letterSpacing: 2,
    fontWeight: '500',
  },
  middle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  nameSection: {
    flex: 1,
  },
  balanceSection: {
    alignItems: 'flex-end',
  },
  label: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 1,
  },
  memberName: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  balance: {
    fontSize: FontSizes.lg,
    color: Colors.success,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  pvSection: {
    alignItems: 'flex-end',
  },
  pvPoints: {
    fontSize: FontSizes.md,
    color: Colors.gold,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  watermark: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  // Compact styles
  cardCompact: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  compactCardNumber: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    fontFamily: 'JetBrains Mono',
    fontWeight: '500',
  },
  compactMemberName: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  compactBalance: {
    fontSize: FontSizes.md,
    color: Colors.success,
    fontWeight: '600',
  },
});

export default NFCCardVisual;
