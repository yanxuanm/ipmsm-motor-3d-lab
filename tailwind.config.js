/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#07090e',
          900: '#0c1017',
          850: '#111723',
          800: '#171f2e',
          700: '#232f46',
          600: '#334464'
        },
        cyan: {
          neon: '#00f2fe',
          glow: '#4facfe'
        },
        amber: {
          neon: '#ffaa00',
          copper: '#d97706'
        },
        emerald: {
          neon: '#10b981',
          bright: '#34d399'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace']
      }
    },
  },
  plugins: [],
}
