/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        'waveform-1': 'waveform 1s ease-in-out infinite',
        'waveform-2': 'waveform 1s ease-in-out 0.1s infinite',
        'waveform-3': 'waveform 1s ease-in-out 0.2s infinite',
        'waveform-4': 'waveform 1s ease-in-out 0.3s infinite',
        'waveform-5': 'waveform 1s ease-in-out 0.4s infinite',
      },
      keyframes: {
        waveform: {
          '0%, 100%': { height: '8px' },
          '50%': { height: '32px' },
        },
      },
    },
  },
  plugins: [],
};
