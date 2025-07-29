/**
 * @fileMetadata
 * @purpose Defines the color palette for the ClaimGuardian application.
 * @owner frontend-team
 * @dependencies []
 * @exports ["COLORS"]
 * @complexity low
 * @tags ["constants", "styling", "colors"]
 * @status active
 */
export const COLORS = {
  primary: '#06b6d4', // Cyan 500 - matches dashboard cyan-400
  accent: '#0ea5e9',  // Sky 500 - complements primary
  danger: '#ef4444',  // Red 500
  warning: '#f59e0b', // Amber 500
  success: '#10b981', // Emerald 500
  info: '#3b82f6',   // Blue 500
  textPrimary: '#FFFFFF',
  textSecondary: '#9ca3af', // Gray 400
  bgPrimary: '#111827', // Gray 900 - matches dashboard
  bgSecondary: '#1f2937', // Gray 800 - matches dashboard cards
  bgTertiary: '#374151', // Gray 700 - matches dashboard borders
  border: '#374151', // Gray 700
  glass: {
    bg: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.1)',
  },
};
