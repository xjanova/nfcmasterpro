// Premium Dark Theme for NFCMasterPro v2.0

export const Colors = {
  // Core Background
  bg: '#0a0a0f',
  surface: '#12121a',
  card: '#1a1a26',
  border: '#2a2a40',

  // Primary & Secondary
  primary: '#6366f1',
  primaryGlow: 'rgba(99, 102, 241, 0.3)',
  secondary: '#22d3ee',
  secondaryGlow: 'rgba(34, 211, 238, 0.2)',

  // Status Colors
  success: '#10b981',
  successGlow: 'rgba(16, 185, 129, 0.2)',
  warning: '#f59e0b',
  warningGlow: 'rgba(245, 158, 11, 0.2)',
  danger: '#ef4444',
  dangerGlow: 'rgba(239, 68, 68, 0.2)',

  // Premium Element
  gold: '#fbbf24',
  goldGlow: 'rgba(251, 191, 36, 0.2)',

  // Text Colors
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  textDim: '#94a3b8',

  // Utility
  overlay: 'rgba(0, 0, 0, 0.7)',
};

export const Gradient = {
  primary: ['#6366f1', '#8b5cf6'],
  secondary: ['#22d3ee', '#06b6d4'],
  card: ['#1a1a26', '#2d2d3d'],
  premium: ['#fbbf24', '#f59e0b'],
  success: ['#10b981', '#059669'],
};

export const Shadow = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 13.16,
    elevation: 10,
  },
};

export const Typography = {
  // Font families
  mono: 'JetBrains Mono',
  sans: 'Inter',
};

export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  display: 34,
};

export const LineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
  xxxxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const Opacity = {
  disabled: 0.5,
  subtle: 0.7,
  active: 1,
};

// Preset Typography Styles
export const TextStyles = {
  displayLarge: {
    fontSize: FontSizes.display,
    lineHeight: FontSizes.display * 1.2,
    fontFamily: Typography.sans,
    color: Colors.text,
  },
  headingXL: {
    fontSize: FontSizes.xxxl,
    lineHeight: FontSizes.xxxl * 1.2,
    fontFamily: Typography.sans,
    color: Colors.text,
  },
  headingLarge: {
    fontSize: FontSizes.xxl,
    lineHeight: FontSizes.xxl * 1.3,
    fontFamily: Typography.sans,
    color: Colors.text,
  },
  headingMedium: {
    fontSize: FontSizes.xl,
    lineHeight: FontSizes.xl * 1.4,
    fontFamily: Typography.sans,
    color: Colors.text,
  },
  bodyLarge: {
    fontSize: FontSizes.lg,
    lineHeight: FontSizes.lg * 1.5,
    fontFamily: Typography.sans,
    color: Colors.text,
  },
  bodyMedium: {
    fontSize: FontSizes.md,
    lineHeight: FontSizes.md * 1.5,
    fontFamily: Typography.sans,
    color: Colors.text,
  },
  bodySmall: {
    fontSize: FontSizes.sm,
    lineHeight: FontSizes.sm * 1.5,
    fontFamily: Typography.sans,
    color: Colors.textMuted,
  },
  labelLarge: {
    fontSize: FontSizes.md,
    lineHeight: FontSizes.md * 1.4,
    fontFamily: Typography.sans,
    color: Colors.text,
  },
  labelMedium: {
    fontSize: FontSizes.sm,
    lineHeight: FontSizes.sm * 1.4,
    fontFamily: Typography.sans,
    color: Colors.text,
  },
  labelSmall: {
    fontSize: FontSizes.xs,
    lineHeight: FontSizes.xs * 1.4,
    fontFamily: Typography.sans,
    color: Colors.textMuted,
  },
  monoLarge: {
    fontSize: FontSizes.lg,
    lineHeight: FontSizes.lg * 1.5,
    fontFamily: Typography.mono,
    color: Colors.secondary,
  },
  monoMedium: {
    fontSize: FontSizes.md,
    lineHeight: FontSizes.md * 1.5,
    fontFamily: Typography.mono,
    color: Colors.secondary,
  },
  monoSmall: {
    fontSize: FontSizes.sm,
    lineHeight: FontSizes.sm * 1.5,
    fontFamily: Typography.mono,
    color: Colors.textMuted,
  },
};
