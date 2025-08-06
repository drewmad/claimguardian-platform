/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Tailwind CSS configuration with enhanced accessibility and mobile-first responsive design"
 * @dependencies ["tailwindcss"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-06T00:00:00Z
 * @notes Updated for WCAG 2.1 AA color contrast compliance and improved mobile touch targets
 */
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
        // Enhanced Color Palette for WCAG 2.1 AA Compliance
        background: '#0f172a', // slate-900
        panel: 'rgba(30, 41, 59, 0.5)', // slate-800 with 50% opacity
        border: '#475569', // slate-600
        'text-primary': '#ffffff',
        'text-secondary': '#e2e8f0', // Updated from #94a3b8 for better contrast (4.5:1 ratio)
        accent: {
          DEFAULT: '#4f46e5', // indigo-600
          hover: '#6366f1', // indigo-500
          border: '#6366f1', // indigo-500
        },
        success: '#16a34a', // green-600
        error: '#f43f5e', // red-500
        warning: '#f59e0b', // amber-500 - Added for better UX
        
        // Legacy colors (keeping for compatibility)
        bgPrimary: '#121212',
        bgSecondary: '#1E1E1E', 
        bgTertiary: '#2A2A2A',
        textPrimary: '#FFFFFF',
        textSecondary: '#E2E8F0', // Updated for accessibility
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
      // Enhanced spacing for mobile touch targets
      spacing: {
        'touch-sm': '44px',  // Minimum touch target
        'touch-md': '48px',  // Preferred touch target
        'touch-lg': '56px',  // Large touch target
      },
      // Responsive font sizes with clamp for fluid typography
      fontSize: {
        'clamp-hero': 'clamp(2.5rem, 5vw, 4rem)',
        'clamp-subtitle': 'clamp(1.125rem, 2.5vw, 1.5rem)',
        'clamp-body': 'clamp(0.875rem, 2vw, 1rem)',
        'clamp-small': 'clamp(0.75rem, 1.5vw, 0.875rem)',
      },
      // Enhanced animations
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'drift-1': 'drift-1 20s ease-in-out infinite alternate',
        'drift-2': 'drift-2 25s ease-in-out infinite alternate',
        'scale-in': 'scaleIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
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
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      // Enhanced screen breakpoints for better responsive design
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // Custom breakpoints for touch devices
        'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
        'hover': { 'raw': '(hover: hover) and (pointer: fine)' },
      },
      // Enhanced focus ring utilities
      ringWidth: {
        'focus': '2px',
      },
      ringColor: {
        'focus': '#6366f1',
      },
      ringOffsetWidth: {
        'focus': '2px',
      },
      // Safe area utilities for mobile devices
      padding: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      margin: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [
    // Custom plugin for accessibility utilities
    function({ addUtilities, theme }) {
      addUtilities({
        '.focus-ring': {
          '&:focus': {
            outline: 'none',
            'ring-width': '2px',
            'ring-color': theme('colors.accent.DEFAULT'),
            'ring-offset-width': '2px',
          },
        },
        '.touch-target': {
          'min-height': '44px',
          'min-width': '44px',
        },
        '.touch-target-lg': {
          'min-height': '48px',
          'min-width': '48px',
        },
        '.skip-link': {
          position: 'absolute',
          top: '-40px',
          left: '6px',
          background: theme('colors.background'),
          color: theme('colors.text-primary'),
          padding: '8px',
          'z-index': '1000',
          'text-decoration': 'none',
          'border-radius': '4px',
          '&:focus': {
            top: '6px',
          },
        },
        '.sr-only-focusable': {
          position: 'absolute !important',
          width: '1px !important',
          height: '1px !important',
          padding: '0 !important',
          margin: '-1px !important',
          overflow: 'hidden !important',
          clip: 'rect(0, 0, 0, 0) !important',
          'white-space': 'nowrap !important',
          'border-width': '0 !important',
          '&:focus': {
            position: 'static !important',
            width: 'auto !important',
            height: 'auto !important',
            padding: 'inherit !important',
            margin: 'inherit !important',
            overflow: 'visible !important',
            clip: 'auto !important',
            'white-space': 'normal !important',
          },
        },
      })
    },
  ],
}