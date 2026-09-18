import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1d2422',
        paper: '#f5f2eb',
        fog: '#e8e4dc',
        transit: '#2f6572',
        ember: '#bb6d4a',
        signal: '#3f806c'
      },
      fontFamily: {
        display: ['var(--font-display)', 'Trebuchet MS', 'sans-serif'],
        ui: ['var(--font-ui)', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace']
      },
      boxShadow: {
        lift: '0 24px 60px rgba(29, 36, 34, 0.10)',
        panel: '0 12px 32px rgba(29, 36, 34, 0.07)'
      },
      borderRadius: {
        '2xl': '1.25rem'
      }
    }
  },
  plugins: []
};

export default config;
