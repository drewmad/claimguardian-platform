/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'eoc-primary': '#1e3a8a', // Dark blue for high priority/navigation
        'eoc-secondary': '#1d4ed8', // Actionable blue
        'eoc-accent': '#f59e0b', // Amber for warnings/attention
        'eoc-background': '#111827', // Dark background for EOC environment
        'eoc-sidebar': '#1f2937', // Slightly lighter dark background for sidebar
        'eoc-danger': '#dc2626', // Red for critical alerts
      },
      boxShadow: {
        'inner-md': 'inset 0 4px 6px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
