/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ts: {
          base:           '#000000',
          surface:        '#0A0A0A',
          elevated:       '#111111',
          subtle:         '#1A1A1A',
          border:         '#222222',
          'border-active':'#333333',
          cyan:           '#00D4FF',
          'cyan-dim':     '#003D4D',
          'cyan-glow':    '#00D4FF22',
          amber:          '#F5A623',
          red:            '#E5484D',
          green:          '#30A46C',
          text:           '#FFFFFF',
          secondary:      '#A0A0A0',
          muted:          '#555555',
          code:           '#E0E0E0',
        },
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'xs2':  ['11px', { lineHeight: '1.4', letterSpacing: '0.04em' }],
        'sm2':  ['13px', { lineHeight: '1.5' }],
        'base2':['15px', { lineHeight: '1.6' }],
        'lg2':  ['18px', { lineHeight: '1.4' }],
        'xl2':  ['22px', { lineHeight: '1.3' }],
        '2xl2': ['28px', { lineHeight: '1.2' }],
        '3xl2': ['36px', { lineHeight: '1.1' }],
        '4xl2': ['48px', { lineHeight: '1.0' }],
      },
      borderRadius: {
        ts: '4px',
        'ts-sm': '2px',
      },
      boxShadow: {
        'ts-card':  '0 0 0 1px #222222',
        'ts-modal': '0 0 0 1px #333333, 0 24px 48px rgba(0,0,0,0.6)',
        'ts-cyan':  '0 0 20px rgba(0,212,255,0.13)',
        'ts-focus': '0 0 0 3px rgba(0,212,255,0.12)',
      },
      transitionDuration: {
        fast: '100ms',
        base: '200ms',
        slow: '350ms',
        reveal: '500ms',
      },
      animation: {
        'fade-in':    'fadeIn 250ms ease forwards',
        'slide-up':   'slideUp 350ms cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-right':'slideRight 300ms ease forwards',
        'pulse-dot':  'pulseDot 1.4s ease-in-out infinite',
        'spin-slow':  'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn:     { from: { opacity: 0 },                     to: { opacity: 1 } },
        slideUp:    { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideRight: { from: { opacity: 0, transform: 'translateX(16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        pulseDot:   { '0%,100%': { opacity: 1, transform: 'scale(1)' }, '50%': { opacity: 0.4, transform: 'scale(0.8)' } },
      },
    },
  },
  plugins: [],
}
