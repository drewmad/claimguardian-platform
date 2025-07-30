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
      },
    },
  },
  plugins: [],
}