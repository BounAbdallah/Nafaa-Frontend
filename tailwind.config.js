/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          DEFAULT: '#112035',
          soft:    '#1C3050',
        },
        primary: {
          50:  '#EEF7FC',
          100: '#C8E5F5',
          300: '#7EC3E8',
          500: '#3AA0D8',
          600: '#2487BF',
          700: '#1A6A97',
        },
        gold:    '#F0A500',
        surface: '#FAFCFE',
        bg:      '#F4F8FB',
        muted: {
          100: '#F1F5F9',
          300: '#C4D0DC',
          500: '#7A90A4',
          700: '#3D5268',
        },
        success: '#1A7A45',
        danger:  '#E05A2B',
        warning: '#B85C00',
      },
      backgroundImage: {
        'gradient-band': 'linear-gradient(90deg, #3AA0D8 0%, #7EC3E8 60%, #EEF7FC 100%)',
        'gradient-blue': 'linear-gradient(135deg, #3AA0D8 0%, #2487BF 100%)',
      },
      borderRadius: {
        badge: '99px',
        btn:   '8px',
        card:  '12px',
        modal: '16px',
      },
      boxShadow: {
        card:  '0 1px 4px rgba(17,32,53,0.06), 0 4px 16px rgba(17,32,53,0.04)',
        nav:   '0 2px 12px rgba(17,32,53,0.12)',
        blue:  '0 4px 16px rgba(58,160,216,0.25)',
        modal: '0 8px 32px rgba(17,32,53,0.15)',
      },
      animation: {
        'fade-in':  'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'slide-in': 'slideIn 0.35s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
