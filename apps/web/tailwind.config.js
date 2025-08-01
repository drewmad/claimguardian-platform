/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    // Include UI package
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Centralized Color Palette for Glass Morphism Design
        background: '#0f172a', // slate-900
        panel: 'rgba(30, 41, 59, 0.5)', // slate-800 with 50% opacity
        border: '#475569', // slate-600
        'text-primary': '#ffffff',
        'text-secondary': '#94a3b8', // slate-400
        accent: {
          DEFAULT: '#4f46e5', // indigo-600
          hover: '#6366f1', // indigo-500
          border: '#6366f1', // indigo-500
        },
        success: '#16a34a', // green-600
        error: '#f43f5e', // red-500
        
        // Legacy colors (keeping for compatibility)
        bgPrimary: '#121212',
        bgSecondary: '#1E1E1E', 
        bgTertiary: '#2A2A2A',
        textPrimary: '#FFFFFF',
        textSecondary: '#E0E0E0',
        'neon-lime': '#39FF14',
        'accent-blue': '#0095FF',
        'danger-red': '#D50000',
        // Brand colors
        crimson: {
          600: '#DC143C',
        },
        // ClaimGuardian brand palette
        'brand-gunmetal': '#2B2D42',
        'brand-royal': '#0038A8', 
        'brand-neon': '#39FF14',
        'brand-crimson': '#DC143C',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
          '50%': { opacity: '0.8', transform: 'scale(1.02) rotate(1deg)' },
        },
        'drift-1': {
          '0%': { transform: 'translate(-50%, -50%) scale(1)' },
          '100%': { transform: 'translate(-20%, -30%) scale(1.2)' },
        },
        'drift-2': {
          '0%': { transform: 'translate(-50%, -50%) scale(1)' },
          '100%': { transform: 'translate(-70%, -70%) scale(1.1)' },
        },
      },
      fontSize: {
        'clamp-hero': 'clamp(2.5rem, 5vw, 4rem)',
        'clamp-subtitle': 'clamp(1.125rem, 2.5vw, 1.5rem)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'drift-1': 'drift-1 20s ease-in-out infinite alternate',
        'drift-2': 'drift-2 25s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
}