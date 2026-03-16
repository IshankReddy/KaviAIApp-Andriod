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
}

const darkColors: ThemeColors = {
  background: '#0A0A0A',
  surface: '#141414',
  surfaceVariant: '#1E1E1E',
  card: '#1A1A1A',
  border: '#2A2A2A',
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  accent: '#66BB6A',
  onPrimary: '#FFFFFF',
  onBackground: '#FFFFFF',
  onSurface: '#E0E0E0',
  onSurfaceVariant: '#AAAAAA',
  userBubble: '#1C313A',
  aiBubble: '#1E1E1E',
  userBubbleText: '#FFFFFF',
  aiBubbleText: '#E0E0E0',
  metaText: '#777777',
  error: '#CF6679',
  warning: '#FFA726',
  downloadProgress: '#2E7D32',
  inputBackground: '#1C1C1C',
  tint: '#4CAF50',
  tabIconDefault: '#666666',
  tabIconSelected: '#4CAF50',
};

const lightColors: ThemeColors = {
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceVariant: '#EEEEEE',
  card: '#FAFAFA',
  border: '#E0E0E0',
  primary: '#2E7D32',
  primaryLight: '#388E3C',
  accent: '#66BB6A',
  onPrimary: '#FFFFFF',
  onBackground: '#1C1C1C',
  onSurface: '#1C1C1C',
  onSurfaceVariant: '#616161',
  userBubble: '#E3F2FD',
  aiBubble: '#FFFFFF',
  userBubbleText: '#1C1C1C',
  aiBubbleText: '#1C1C1C',
  metaText: '#757575',
  error: '#B00020',
  warning: '#F57C00',
  downloadProgress: '#2E7D32',
  inputBackground: '#FFFFFF',
  tint: '#388E3C',
  tabIconDefault: '#9E9E9E',
  tabIconSelected: '#2E7D32',
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
            level3: '#252525',
            level4: '#2A2A2A',
            level5: '#2F2F2F',
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
            level3: '#E0E0E0',
            level4: '#BDBDBD',
            level5: '#9E9E9E',
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