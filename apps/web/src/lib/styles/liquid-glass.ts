/**
 * @fileMetadata
 * @purpose "Centralized liquid glass design system for consistent premium visual effects"
 * @dependencies []
 * @owner frontend-team
 * @status stable
 * @complexity medium
 */

/**
 * Liquid Glass Design System
 * Premium visual effects with consistent styling across the application
 */

export const liquidGlass = {
  // Background patterns
  backgrounds: {
    default: 'bg-gray-800/70 backdrop-blur-xl border-gray-700/50',
    primary: 'bg-gradient-to-br from-indigo-600/30 to-purple-600/30 backdrop-blur-xl border-white/10',
    secondary: 'bg-gray-900/70 backdrop-blur-md border-gray-700/40',
    accent: 'bg-gradient-to-br from-indigo-600/30 to-purple-600/30 backdrop-blur-xl border-white/10',
    success: 'bg-gradient-to-br from-green-600/30 to-emerald-600/20 backdrop-blur-xl border-green-600/40',
    warning: 'bg-gradient-to-br from-yellow-600/30 to-orange-600/20 backdrop-blur-xl border-yellow-600/40',
    error: 'bg-gradient-to-br from-red-600/30 to-pink-600/20 backdrop-blur-xl border-red-600/40',
    info: 'bg-gradient-to-br from-blue-600/30 to-cyan-600/20 backdrop-blur-xl border-blue-600/40'
  },

  // Shadow effects
  shadows: {
    subtle: 'shadow-[0_8px_32px_rgba(0,0,0,0.2)]',
    moderate: 'shadow-[0_12px_40px_rgba(0,0,0,0.3)]',
    pronounced: 'shadow-[0_20px_60px_rgba(0,0,0,0.4)]',
    glow: {
      primary: 'shadow-[0_8px_32px_rgba(99,102,241,0.2)]',
      success: 'shadow-[0_8px_32px_rgba(34,197,94,0.2)]',
      warning: 'shadow-[0_8px_32px_rgba(245,158,11,0.2)]',
      error: 'shadow-[0_8px_32px_rgba(220,38,38,0.2)]',
      info: 'shadow-[0_8px_32px_rgba(59,130,246,0.2)]'
    }
  },

  // Hover effects
  hover: {
    subtle: 'hover:shadow-[0_16px_48px_rgba(0,0,0,0.25)] transition-all duration-300',
    moderate: 'hover:shadow-[0_20px_60px_rgba(99,102,241,0.15)] transition-all duration-500',
    pronounced: 'hover:shadow-[0_25px_80px_rgba(99,102,241,0.25)] transition-all duration-700',
    glow: {
      primary: 'hover:shadow-[0_12px_40px_rgba(99,102,241,0.3)]',
      success: 'hover:shadow-[0_12px_40px_rgba(34,197,94,0.3)]',
      warning: 'hover:shadow-[0_12px_40px_rgba(245,158,11,0.3)]',
      error: 'hover:shadow-[0_12px_40px_rgba(220,38,38,0.3)]',
      info: 'hover:shadow-[0_12px_40px_rgba(59,130,246,0.3)]'
    }
  },

  // Button variants
  buttons: {
    primary: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-[0_8px_32px_rgba(99,102,241,0.3)] hover:shadow-[0_12px_40px_rgba(99,102,241,0.4)] transition-all duration-300 backdrop-blur-md border-0',
    secondary: 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border-gray-600/50 backdrop-blur-md transition-all duration-300',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-[0_8px_32px_rgba(34,197,94,0.3)] backdrop-blur-md border-0',
    warning: 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white shadow-[0_8px_32px_rgba(245,158,11,0.3)] backdrop-blur-md border-0',
    error: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-[0_8px_32px_rgba(220,38,38,0.3)] backdrop-blur-md border-0',
    info: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-[0_8px_32px_rgba(59,130,246,0.3)] backdrop-blur-md border-0'
  },

  // Card variants
  cards: {
    default: 'bg-gray-800/70 backdrop-blur-xl border-gray-700/50 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(99,102,241,0.15)] transition-all duration-500',
    elevated: 'bg-gray-800/80 backdrop-blur-xl border-gray-700/60 shadow-[0_20px_60px_rgba(0,0,0,0.4)] hover:shadow-[0_25px_80px_rgba(99,102,241,0.2)] transition-all duration-700',
    primary: 'bg-gradient-to-br from-indigo-600/30 to-purple-600/30 backdrop-blur-xl border-white/10 shadow-[0_20px_60px_rgba(99,102,241,0.3)] hover:shadow-[0_25px_80px_rgba(99,102,241,0.4)] transition-all duration-700',
    accent: 'bg-gradient-to-br from-indigo-600/30 to-purple-600/30 backdrop-blur-xl border-white/10 shadow-[0_20px_60px_rgba(99,102,241,0.3)] hover:shadow-[0_25px_80px_rgba(99,102,241,0.4)] transition-all duration-700',
    success: 'bg-gradient-to-br from-green-900/30 to-emerald-900/20 backdrop-blur-xl border-green-600/40 shadow-[0_20px_60px_rgba(34,197,94,0.2)] hover:shadow-[0_25px_80px_rgba(34,197,94,0.3)] transition-all duration-500',
    warning: 'bg-gradient-to-br from-yellow-900/30 to-orange-900/20 backdrop-blur-xl border-yellow-600/40 shadow-[0_20px_60px_rgba(245,158,11,0.2)] hover:shadow-[0_25px_80px_rgba(245,158,11,0.3)] transition-all duration-500',
    error: 'bg-red-900/20 border-red-600/30 backdrop-blur-md shadow-[0_8px_32px_rgba(220,38,38,0.2)]',
    info: 'bg-gradient-to-br from-blue-900/30 to-indigo-900/20 backdrop-blur-xl border-blue-600/40 shadow-[0_20px_60px_rgba(59,130,246,0.2)] hover:shadow-[0_25px_80px_rgba(59,130,246,0.3)] transition-all duration-500'
  },

  // Icon containers
  iconContainers: {
    small: 'p-2 bg-gradient-to-br from-indigo-600/30 to-purple-600/20 backdrop-blur-md rounded-lg border border-white/10 shadow-[0_8px_32px_rgba(99,102,241,0.2)]',
    medium: 'p-3 bg-gradient-to-br from-indigo-600/30 to-purple-600/20 backdrop-blur-md rounded-xl border border-white/10 shadow-[0_8px_32px_rgba(99,102,241,0.3)]',
    large: 'p-4 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(99,102,241,0.3)] hover:shadow-[0_25px_80px_rgba(99,102,241,0.4)] transition-all duration-700'
  },

  // Input fields
  inputs: {
    default: 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 backdrop-blur-md focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300',
    error: 'bg-gray-700/50 border-red-500/50 text-white placeholder-gray-400 backdrop-blur-md focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-300'
  },

  // Background orbs for ambient lighting
  orbs: {
    header: 'absolute -top-10 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/25 via-purple-500/20 to-blue-600/25 rounded-full blur-3xl animate-pulse opacity-40',
    section: 'absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-400/20 via-indigo-500/15 to-cyan-600/20 rounded-full blur-2xl opacity-30'
  },

  // Link styles
  links: {
    default: 'text-indigo-400 hover:text-indigo-300 transition-colors duration-300',
    button: 'text-indigo-400 hover:text-indigo-300 text-sm inline-flex items-center gap-2 backdrop-blur-md bg-gray-800/50 px-3 py-2 rounded-lg border border-indigo-400/20 shadow-[0_8px_32px_rgba(99,102,241,0.15)] hover:shadow-[0_8px_32px_rgba(99,102,241,0.25)] transition-all duration-300'
  },

  // Badge styles
  badges: {
    primary: 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-indigo-300 border-indigo-600/30 backdrop-blur-md shadow-[0_8px_32px_rgba(99,102,241,0.2)]',
    success: 'bg-gradient-to-r from-green-600/30 to-emerald-600/30 text-green-300 border-green-600/30 backdrop-blur-md shadow-[0_8px_32px_rgba(34,197,94,0.2)]',
    warning: 'bg-gradient-to-r from-yellow-600/30 to-orange-600/30 text-yellow-300 border-yellow-600/30 backdrop-blur-md shadow-[0_8px_32px_rgba(245,158,11,0.2)]',
    error: 'bg-gradient-to-r from-red-600/30 to-pink-600/30 text-red-300 border-red-600/30 backdrop-blur-md shadow-[0_8px_32px_rgba(220,38,38,0.2)]',
    info: 'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 text-blue-300 border-blue-600/30 backdrop-blur-md shadow-[0_8px_32px_rgba(59,130,246,0.2)]'
  },

  // Text effects
  text: {
    glowPrimary: 'drop-shadow-[0_0_20px_rgba(99,102,241,0.8)]',
    glowSecondary: 'drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]',
    glowSubtle: 'drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]',
    shadowLight: 'drop-shadow-[0_2px_20px_rgba(255,255,255,0.3)]',
    shadowDark: 'drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]'
  }
} as const

/**
 * Utility function to combine liquid glass classes
 */
export function combineLiquidGlass(...classes: string[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Get themed variant based on status or type
 */
export function getLiquidGlassVariant(
  variant: 'primary' | 'success' | 'warning' | 'error' | 'info' = 'primary',
  type: 'background' | 'button' | 'card' | 'badge' = 'background'
): string {
  const variantMap = {
    primary: 'primary',
    success: 'success', 
    warning: 'warning',
    error: 'error',
    info: 'info'
  } as const

  const mappedVariant = variantMap[variant]
  
  switch (type) {
    case 'background':
      return liquidGlass.backgrounds[mappedVariant] || liquidGlass.backgrounds.default
    case 'button':
      return liquidGlass.buttons[mappedVariant] || liquidGlass.buttons.primary
    case 'card':
      return liquidGlass.cards[mappedVariant] || liquidGlass.cards.default
    case 'badge':
      return liquidGlass.badges[mappedVariant] || liquidGlass.badges.primary
    default:
      return liquidGlass.backgrounds[mappedVariant] || liquidGlass.backgrounds.default
  }
}