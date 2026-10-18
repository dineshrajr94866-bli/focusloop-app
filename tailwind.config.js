/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F6F4FC',
        surface: '#FFFFFF',
        ink: '#201B3A',
        inkSoft: '#5C5578',
        focus: {
          DEFAULT: '#6C5CE7',
          soft: '#EDEAFD',
          dark: '#4B3FC2'
        },
        energy: {
          DEFAULT: '#FF6B4A',
          soft: '#FFE7E0'
        },
        calm: {
          DEFAULT: '#2BB79E',
          soft: '#E1F6F1'
        },
        reward: {
          DEFAULT: '#FFB238',
          soft: '#FFF3DD'
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      borderRadius: {
        xl2: '1.25rem'
      },
      boxShadow: {
        soft: '0 8px 30px -12px rgba(32, 27, 58, 0.15)',
        card: '0 2px 10px -4px rgba(32, 27, 58, 0.10)'
      }
    }
  },
  plugins: []
};
