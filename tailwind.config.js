/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Onest', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      colors: {
        brand: {
          blue: '#3348FF',
          azure: '#3DA3F5',
          orange: '#FF5722',
          orangeHover: '#E64A19',
        },
        themeBg: 'var(--bg-primary)',
        themeContainer: 'var(--bg-secondary)',
        themeBorder: 'var(--border-color)',
        themeText: 'var(--text-primary)',
        themeTextSec: 'var(--text-secondary)',
        themeAccent: 'var(--accent-color)',
        light: {
          bg: '#F3F4F6',
          container: '#FFFFFF',
          border: '#E5E7EB',
          textSecondary: '#6B7280',
        },
        dark: {
          bg: '#121212',
          container: '#1E1E1E',
          sidebar: '#2D2D2D',
          border: '#3F3F3F',
          textSecondary: '#9CA3AF',
        }
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      }
    },
  },
  plugins: [],
}
