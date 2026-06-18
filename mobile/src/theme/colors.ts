// Brand palette — mirrors the web Tailwind config (tailwind.config.ts).
// "Where the Jungle Meets the Sea".

export const colors = {
  jungle: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    700: '#065f46',
    800: '#064e3b',
    900: '#022c22',
  },
  sunset: {
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
  },
  sand: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
  },
  // Neutral greys
  white: '#ffffff',
  black: '#0a0a0a',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
} as const

// Semantic shortcuts
export const theme = {
  primary: colors.jungle[700],
  primaryDark: colors.jungle[900],
  accent: colors.sunset[500],
  background: colors.white,
  surface: colors.gray[50],
  text: colors.gray[900],
  textMuted: colors.gray[500],
  border: colors.gray[200],
} as const
