import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f6ff',
          100: '#e3e9ff',
          200: '#c2cdff',
          300: '#9eaeff',
          400: '#7586ff',
          500: '#4b5df5',
          600: '#3342d8',
          700: '#2733ab',
          800: '#1d257d',
          900: '#161d5c'
        }
      }
    }
  },
  plugins: []
};

export default config;
