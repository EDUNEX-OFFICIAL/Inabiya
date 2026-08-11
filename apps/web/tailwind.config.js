/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  safelist: [
    'gift-offer-card--blush',
    'gift-offer-card--sky',
    'gift-offer-card--lavender',
    'gift-brand-panel__pill--pink',
    'gift-brand-panel__pill--mint',
    'gift-brand-panel__pill--lavender',
    'gift-brand-panel__pill--sky',
    'gift-usp-cards__item--pink',
    'gift-usp-cards__item--mint',
    'gift-usp-cards__item--sky',
    'gift-usp-cards__item--lavender',
    'gift-testimonial-card--pink',
    'gift-testimonial-card--mint',
    'gift-testimonial-card--sky',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          hover: 'var(--primary-hover, var(--primary))',
        },
        secondary: {
          DEFAULT: 'var(--secondary, var(--muted, currentColor))',
          foreground: 'var(--secondary-foreground, var(--foreground))',
        },
        surface: {
          DEFAULT: 'var(--surface, var(--background))',
          soft: 'var(--surface-soft, var(--background))',
          nav: 'var(--surface-nav, var(--surface, var(--background)))',
        },
        border: {
          DEFAULT: 'var(--border, currentColor)',
          subtle: 'var(--border-subtle, var(--border, currentColor))',
          strong: 'var(--border-strong, var(--border, currentColor))',
          focus: 'var(--border-focus, var(--ring, currentColor))',
        },
        ring: 'var(--ring, var(--primary))',
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
        body: 'var(--inabiya-body, var(--blog-body, var(--muted-foreground, var(--foreground))))',
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
      fontSize: {
        display: ['var(--text-display)', { lineHeight: 'var(--leading-display)' }],
        h1: ['var(--text-h1)', { lineHeight: 'var(--leading-tight)' }],
        h2: ['var(--text-h2)', { lineHeight: '1.25' }],
        body: ['var(--text-body)', { lineHeight: 'var(--leading-body)' }],
        'body-lg': ['var(--text-body-lg)', { lineHeight: 'var(--leading-body)' }],
        caption: ['var(--text-caption)', { lineHeight: '1.4', letterSpacing: '0.1em' }],
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
      transitionDuration: {
        fast: 'var(--duration-fast, 160ms)',
        med: 'var(--duration-med, 220ms)',
      },
      zIndex: {
        nav: 'var(--z-nav, 30)',
        overlay: 'var(--z-overlay, 40)',
        modal: 'var(--z-modal, 50)',
      },
      maxWidth: {
        page: 'var(--page-max, none)',
      },
      minHeight: {
        tap: 'var(--tap-min, 48px)',
      },
    },
  },
  plugins: [],
};
