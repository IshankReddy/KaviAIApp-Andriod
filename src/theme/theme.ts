import React, { createContext, useContext } from 'react';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { DefaultTheme as NavDarkTheme } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import { settingsStore } from '../stores/SettingsStore';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceVariant: string;
  card: string;
  border: string;
  primary: string;
  primaryLight: string;
  accent: string;
  onPrimary: string;
  onBackground: string;
  onSurface: string;
  onSurfaceVariant: string;
  userBubble: string;
  aiBubble: string;
  userBubbleText: string;
  aiBubbleText: string;
  metaText: string;
  error: string;
  warning: string;
  downloadProgress: string;
  inputBackground: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  // New design tokens
  shadowColor: string;
  success: string;
  primaryGradient: readonly [string, string, ...string[]];
  secondaryGradient: readonly [string, string, ...string[]];
  accentGradient: readonly [string, string, ...string[]];
  glassBackground: string;
  glassBorder: string;
}

export const DesignTokens = {
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 18,
    xl: 24,
    full: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

const darkColors: ThemeColors = {
  background: '#0B0D11', // Total Black/Dark
  surface: '#151921',
  surfaceVariant: '#1D232D',
  card: '#181D26',
  border: '#252C3A',
  primary: '#7C3AED', // Vibrant Violet
  primaryLight: '#A78BFA',
  accent: '#F472B6', // Rose
  onPrimary: '#FFFFFF',
  onBackground: '#F8FAFC',
  onSurface: '#F1F5F9',
  onSurfaceVariant: '#94A3B8',
  userBubble: '#7C3AED',
  aiBubble: '#1D232D',
  userBubbleText: '#FFFFFF',
  aiBubbleText: '#E2E8F0',
  metaText: '#64748B',
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  downloadProgress: '#7C3AED',
  inputBackground: '#151921',
  tint: '#A78BFA',
  tabIconDefault: '#64748B',
  tabIconSelected: '#7C3AED',
  shadowColor: '#000000',
  primaryGradient: ['#7C3AED', '#4F46E5'], // Violet to Indigo
  secondaryGradient: ['#3B82F6', '#2563EB'], // Blue
  accentGradient: ['#F472B6', '#E11D48'], // Rose to Crimson
  glassBackground: 'rgba(21, 25, 33, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
};

const lightColors: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  primary: '#6366F1', // Indigo
  primaryLight: '#818CF8',
  accent: '#DB2777', // Rose
  onPrimary: '#FFFFFF',
  onBackground: '#0F172A',
  onSurface: '#1E293B',
  onSurfaceVariant: '#475569',
  userBubble: '#6366F1',
  aiBubble: '#F1F5F9',
  userBubbleText: '#FFFFFF',
  aiBubbleText: '#1E293B',
  metaText: '#64748B',
  error: '#DC2626',
  warning: '#D97706',
  success: '#059669',
  downloadProgress: '#6366F1',
  inputBackground: '#F1F5F9',
  tint: '#6366F1',
  tabIconDefault: '#94A3B8',
  tabIconSelected: '#6366F1',
  shadowColor: '#64748B',
  primaryGradient: ['#6366F1', '#4F46E5'],
  secondaryGradient: ['#3B82F6', '#2563EB'],
  accentGradient: ['#DB2777', '#BE123C'],
  glassBackground: 'rgba(255, 255, 255, 0.8)',
  glassBorder: 'rgba(0, 0, 0, 0.05)',
};

/** @deprecated Use useTheme().Colors for reactive theme. Kept for non-component usage. */
export const Colors = darkColors;

export function getTheme(dark: boolean) {
  const Colors = dark ? darkColors : lightColors;
  const PaperTheme = dark
    ? {
        ...MD3DarkTheme,
        colors: {
          ...MD3DarkTheme.colors,
          primary: Colors.primary,
          secondary: Colors.accent,
          background: Colors.background,
          surface: Colors.surface,
          surfaceVariant: Colors.surfaceVariant,
          onBackground: Colors.onBackground,
          onSurface: Colors.onSurface,
          onSurfaceVariant: Colors.onSurfaceVariant,
          error: Colors.error,
          outline: Colors.border,
          elevation: {
            level0: Colors.background,
            level1: Colors.surface,
            level2: Colors.surfaceVariant,
            level3: '#2D343F',
            level4: '#353D4A',
            level5: '#3D4655',
          },
        },
      }
    : {
        ...MD3LightTheme,
        colors: {
          ...MD3LightTheme.colors,
          primary: Colors.primary,
          secondary: Colors.accent,
          background: Colors.background,
          surface: Colors.surface,
          surfaceVariant: Colors.surfaceVariant,
          onBackground: Colors.onBackground,
          onSurface: Colors.onSurface,
          onSurfaceVariant: Colors.onSurfaceVariant,
          error: Colors.error,
          outline: Colors.border,
          elevation: {
            level0: Colors.background,
            level1: Colors.surface,
            level2: Colors.surfaceVariant,
            level3: '#E2E8F0',
            level4: '#CBD5E1',
            level5: '#94A3B8',
          },
        },
      };

  const NavTheme = {
    ...NavDarkTheme,
    dark,
    colors: {
      ...NavDarkTheme.colors,
      background: Colors.background,
      card: Colors.surface,
      text: Colors.onBackground,
      border: Colors.border,
      primary: Colors.primary,
      notification: Colors.error,
    },
  };

  return { Colors, PaperTheme, NavTheme, dark };
}

export type Theme = ReturnType<typeof getTheme>;

const ThemeContext = createContext<Theme | null>(null);

export const ThemeProvider = observer(function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dark = settingsStore.app.darkMode;
  const theme = React.useMemo(() => getTheme(dark), [dark]);
  return React.createElement(ThemeContext.Provider, { value: theme }, children);
});

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used within ThemeProvider');
  return theme;
}

// Legacy exports for components that will be updated to useTheme()
export const PaperTheme = getTheme(true).PaperTheme;
export const NavTheme = getTheme(true).NavTheme;