/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        surface: {
          DEFAULT: 'var(--surface, var(--background))',
          soft: 'var(--surface-soft, var(--background))',
        },
        border: {
          DEFAULT: 'var(--border, currentColor)',
          subtle: 'var(--border-subtle, var(--border, currentColor))',
          strong: 'var(--border-strong, var(--border, currentColor))',
        },
        success: {
          DEFAULT: 'var(--success, #1b7a4a)',
          bg: 'var(--success-bg, #e8f7ef)',
        },
        warning: {
          DEFAULT: 'var(--warning, #9a6700)',
          bg: 'var(--warning-bg, #fff6e0)',
        },
        danger: {
          DEFAULT: 'var(--danger, #b42318)',
          bg: 'var(--danger-bg, #fef3f2)',
        },
        info: {
          DEFAULT: 'var(--info, #175cd3)',
          bg: 'var(--info-bg, #eff8ff)',
        },
        body: 'var(--inabiya-body, var(--foreground))',
        muted: 'var(--muted-foreground, var(--foreground))',
      },
      spacing: {
        'gs-1': 'var(--space-1, 0.25rem)',
        'gs-2': 'var(--space-2, 0.5rem)',
        'gs-3': 'var(--space-3, 0.75rem)',
        'gs-4': 'var(--space-4, 1rem)',
        'gs-5': 'var(--space-5, 1.5rem)',
        'gs-6': 'var(--space-6, 2rem)',
        'gs-7': 'var(--space-7, 3rem)',
        'gs-8': 'var(--space-8, 4rem)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      borderRadius: {
        brand: 'var(--radius)',
        clay: 'var(--radius-card, var(--clay-radius, 1.75rem))',
        control: 'var(--radius-control, var(--clay-radius-sm, 1.15rem))',
        pill: 'var(--radius-pill, 9999px)',
      },
      boxShadow: {
        clay: 'var(--clay-shadow)',
        'clay-hover': 'var(--clay-shadow-hover)',
        'clay-press': 'var(--clay-shadow-press)',
        brand: 'var(--shadow-brand)',
      },
      maxWidth: {
        page: 'var(--page-max, 64rem)',
      },
      minHeight: {
        tap: 'var(--tap-min, 48px)',
      },
    },
  },
  plugins: [],
};
