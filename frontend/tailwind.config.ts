import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          sunken: 'var(--surface-sunken)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          muted: 'var(--ink-muted)',
        },
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        brand: {
          DEFAULT: 'var(--brand)',
          hover: 'var(--brand-hover)',
          soft: 'var(--brand-soft)',
          'on-brand': 'var(--on-brand)',
        },
        focus: 'var(--focus)',
        canvas: 'var(--canvas)',
        verdict: {
          pass: {
            fg: 'var(--pass-fg)',
            bg: 'var(--pass-bg)',
            line: 'var(--pass-line)',
          },
          fail: {
            fg: 'var(--fail-fg)',
            bg: 'var(--fail-bg)',
            line: 'var(--fail-line)',
          },
          unc: {
            fg: 'var(--unc-fg)',
            bg: 'var(--unc-bg)',
            line: 'var(--unc-line)',
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        overlay: 'var(--overlay-shadow)',
      },
    },
  },
  plugins: [],
};

export default config;
