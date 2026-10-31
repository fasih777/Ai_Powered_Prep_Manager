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
        // Blueprint §3.2 exact tokens
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

        // Blueprint flat verdict tokens
        'pass-fg': 'var(--pass-fg)',
        'pass-bg': 'var(--pass-bg)',
        'pass-line': 'var(--pass-line)',
        'fail-fg': 'var(--fail-fg)',
        'fail-bg': 'var(--fail-bg)',
        'fail-line': 'var(--fail-line)',
        'unc-fg': 'var(--unc-fg)',
        'unc-bg': 'var(--unc-bg)',
        'unc-line': 'var(--unc-line)',

        // Blueprint nested verdict tokens
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

        // Alias layer for bench-* and status-* compatibility
        bench: {
          paper: 'var(--bg)',
          surface: 'var(--surface)',
          sunken: 'var(--surface-sunken)',
          ink: 'var(--ink)',
          muted: 'var(--ink-muted)',
          line: 'var(--line)',
          'line-strong': 'var(--line-strong)',
          brand: 'var(--brand)',
        },
        status: {
          pass: 'var(--pass-fg)',
          'pass-bg': 'var(--pass-bg)',
          'pass-line': 'var(--pass-line)',
          fail: 'var(--fail-fg)',
          'fail-bg': 'var(--fail-bg)',
          'fail-line': 'var(--fail-line)',
          unc: 'var(--unc-fg)',
          'unc-bg': 'var(--unc-bg)',
          'unc-line': 'var(--unc-line)',
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
