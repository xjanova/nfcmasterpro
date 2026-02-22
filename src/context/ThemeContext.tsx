import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  bg: string;
  surface: string;
  card: string;
  border: string;
  primary: string;
  primaryGlow: string;
  secondary: string;
  secondaryGlow: string;
  success: string;
  successGlow: string;
  warning: string;
  warningGlow: string;
  danger: string;
  dangerGlow: string;
  gold: string;
  goldGlow: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textDim: string;
  overlay: string;
  tabBarBg: string;
  statusBarStyle: 'light-content' | 'dark-content';
}

export const DarkColors: ThemeColors = {
  bg: '#0a0a0f',
  surface: '#12121a',
  card: '#1a1a26',
  border: '#2a2a40',
  primary: '#6366f1',
  primaryGlow: 'rgba(99, 102, 241, 0.3)',
  secondary: '#22d3ee',
  secondaryGlow: 'rgba(34, 211, 238, 0.2)',
  success: '#10b981',
  successGlow: 'rgba(16, 185, 129, 0.2)',
  warning: '#f59e0b',
  warningGlow: 'rgba(245, 158, 11, 0.2)',
  danger: '#ef4444',
  dangerGlow: 'rgba(239, 68, 68, 0.2)',
  gold: '#fbbf24',
  goldGlow: 'rgba(251, 191, 36, 0.2)',
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  textDim: '#94a3b8',
  overlay: 'rgba(0, 0, 0, 0.7)',
  tabBarBg: 'rgba(18, 18, 26, 0.95)',
  statusBarStyle: 'light-content',
};

export const LightColors: ThemeColors = {
  bg: '#f8fafc',
  surface: '#ffffff',
  card: '#ffffff',
  border: '#e2e8f0',
  primary: '#6366f1',
  primaryGlow: 'rgba(99, 102, 241, 0.15)',
  secondary: '#0891b2',
  secondaryGlow: 'rgba(8, 145, 178, 0.12)',
  success: '#059669',
  successGlow: 'rgba(5, 150, 105, 0.12)',
  warning: '#d97706',
  warningGlow: 'rgba(217, 119, 6, 0.12)',
  danger: '#dc2626',
  dangerGlow: 'rgba(220, 38, 38, 0.12)',
  gold: '#d97706',
  goldGlow: 'rgba(217, 119, 6, 0.12)',
  text: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#94a3b8',
  textDim: '#64748b',
  overlay: 'rgba(0, 0, 0, 0.4)',
  tabBarBg: 'rgba(255, 255, 255, 0.95)',
  statusBarStyle: 'dark-content',
};

interface ThemeContextType {
  theme: ThemeMode;
  colors: ThemeColors;
  setTheme: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = '@nfc_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') {
          setThemeState(saved);
        }
      } catch {
        // use default
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {}
  };

  const toggleTheme = async () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    await setTheme(next);
  };

  const colors = theme === 'dark' ? DarkColors : LightColors;

  const value: ThemeContextType = {
    theme,
    colors,
    setTheme,
    toggleTheme,
  };

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export default ThemeProvider;
