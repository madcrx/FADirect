import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

/**
 * FA Direct Brand Theme
 * Professional, calming colours appropriate for funeral services
 */
export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    // Primary brand colour - Deep navy blue (professional, trustworthy)
    primary: '#1A3A52',
    primaryContainer: '#2C5F7F',
    onPrimary: '#FFFFFF',

    // Secondary - Soft gold (warmth, care)
    secondary: '#B8956A',
    secondaryContainer: '#D4B896',
    onSecondary: '#FFFFFF',

    // Tertiary - Muted sage green (peace, calm)
    tertiary: '#7A9B8E',
    tertiaryContainer: '#A4C4B5',
    onTertiary: '#FFFFFF',

    // Background
    background: '#F5F7FA',
    onBackground: '#1C1C1E',

    // Surface
    surface: '#FFFFFF',
    onSurface: '#1C1C1E',
    surfaceVariant: '#E8ECF0',
    onSurfaceVariant: '#49454F',

    // Status colours
    error: '#BA1A1A',
    errorContainer: '#FFDAD6',
    onError: '#FFFFFF',

    success: '#2E7D32',
    warning: '#F57C00',
    info: '#1976D2',

    // Outline
    outline: '#79747E',
    outlineVariant: '#CAC4D0',

    // Message bubbles
    messageSent: '#2C5F7F',
    messageReceived: '#E8ECF0',
  },
  fonts: {
    ...DefaultTheme.fonts,
    displayLarge: {
      ...DefaultTheme.fonts.displayLarge,
      fontFamily: 'System',
    },
    displayMedium: {
      ...DefaultTheme.fonts.displayMedium,
      fontFamily: 'System',
    },
    displaySmall: {
      ...DefaultTheme.fonts.displaySmall,
      fontFamily: 'System',
    },
    headlineLarge: {
      ...DefaultTheme.fonts.headlineLarge,
      fontFamily: 'System',
    },
    headlineMedium: {
      ...DefaultTheme.fonts.headlineMedium,
      fontFamily: 'System',
    },
    headlineSmall: {
      ...DefaultTheme.fonts.headlineSmall,
      fontFamily: 'System',
    },
    titleLarge: {
      ...DefaultTheme.fonts.titleLarge,
      fontFamily: 'System',
      fontWeight: '600',
    },
    titleMedium: {
      ...DefaultTheme.fonts.titleMedium,
      fontFamily: 'System',
      fontWeight: '600',
    },
    titleSmall: {
      ...DefaultTheme.fonts.titleSmall,
      fontFamily: 'System',
      fontWeight: '600',
    },
    bodyLarge: {
      ...DefaultTheme.fonts.bodyLarge,
      fontFamily: 'System',
    },
    bodyMedium: {
      ...DefaultTheme.fonts.bodyMedium,
      fontFamily: 'System',
    },
    bodySmall: {
      ...DefaultTheme.fonts.bodySmall,
      fontFamily: 'System',
    },
    labelLarge: {
      ...DefaultTheme.fonts.labelLarge,
      fontFamily: 'System',
      fontWeight: '500',
    },
    labelMedium: {
      ...DefaultTheme.fonts.labelMedium,
      fontFamily: 'System',
      fontWeight: '500',
    },
    labelSmall: {
      ...DefaultTheme.fonts.labelSmall,
      fontFamily: 'System',
      fontWeight: '500',
    },
  },
  roundness: 12,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

export type AppTheme = typeof theme;
