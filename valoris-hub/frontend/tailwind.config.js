/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#07070B',
          alt: '#0B1020',
        },
        roxo: {
          DEFAULT: '#6C3BFF',
          claro: '#B05CFF',
        },
        azul: '#36A8FF',
        dourado: '#D9B14A',
        vidro: 'rgba(255,255,255,0.04)',
        linha: 'rgba(255,255,255,0.08)',
        texto: {
          DEFAULT: '#F4F3FA',
          suave: '#9C97B5',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'grad-marca': 'linear-gradient(135deg, #6C3BFF 0%, #B05CFF 55%, #36A8FF 100%)',
        'grad-radial-roxo': 'radial-gradient(circle, rgba(108,59,255,0.35) 0%, rgba(108,59,255,0) 70%)',
        'grad-radial-azul': 'radial-gradient(circle, rgba(54,168,255,0.3) 0%, rgba(54,168,255,0) 70%)',
      },
      boxShadow: {
        glow: '0 0 24px rgba(108,59,255,0.45)',
        'glow-azul': '0 0 24px rgba(54,168,255,0.4)',
        'glow-dourado': '0 0 20px rgba(217,177,74,0.35)',
      },
      keyframes: {
        flutuar: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        rolar: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        flutuar: 'flutuar 6s ease-in-out infinite',
        rolar: 'rolar 26s linear infinite',
      },
    },
  },
  plugins: [],
};
