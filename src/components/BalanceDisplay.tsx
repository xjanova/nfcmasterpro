import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, FontSizes, Spacing } from '../utils/theme';

interface BalanceDisplayProps {
  amount: number;
  currency?: string;
  pvPoints?: number;
  size?: 'sm' | 'md' | 'lg';
  showPV?: boolean;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  amount,
  currency = '฿',
  pvPoints = 0,
  size = 'md',
  showPV = true,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: amount,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [amount, animatedValue]);

  const sizeConfig = {
    sm: {
      mainFontSize: FontSizes.lg,
      currencyFontSize: FontSizes.md,
      pvFontSize: FontSizes.sm,
      gap: Spacing.xs,
    },
    md: {
      mainFontSize: FontSizes.xxxl,
      currencyFontSize: FontSizes.lg,
      pvFontSize: FontSizes.md,
      gap: Spacing.sm,
    },
    lg: {
      mainFontSize: 48,
      currencyFontSize: FontSizes.xxl,
      pvFontSize: FontSizes.lg,
      gap: Spacing.md,
    },
  };

  const config = sizeConfig[size];

  const displayValue = animatedValue.interpolate({
    inputRange: [0, amount],
    outputRange: ['0', amount.toString()],
  });

  const formatBalance = (value: number): string => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <View style={[styles.container, { gap: config.gap }]}>
      <View style={styles.balanceRow}>
        <Text style={[styles.amount, { fontSize: config.mainFontSize }]}>
          {formatBalance(amount)}
        </Text>
        <Text style={[styles.currency, { fontSize: config.currencyFontSize }]}>
          {currency}
        </Text>
      </View>

      {showPV && pvPoints > 0 && (
        <View style={styles.pvContainer}>
          <Text style={[styles.pvLabel, { fontSize: config.pvFontSize }]}>
            {pvPoints} PV Points
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  amount: {
    color: Colors.text,
    fontWeight: '700',
    fontFamily: 'JetBrains Mono',
  },
  currency: {
    color: Colors.secondary,
    fontWeight: '600',
  },
  pvContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  pvLabel: {
    color: Colors.gold,
    fontWeight: '600',
  },
});

export default BalanceDisplay;
