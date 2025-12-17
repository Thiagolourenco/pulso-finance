/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Primária - Azul (seguindo CORES.md)
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA', // Dark mode focus
          500: '#3B82F6', // Dark mode primary
          600: '#2563EB', // Light mode primary/focus
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // Verde - Receita, saldo positivo, progresso (seguindo CORES.md)
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7', // Light mode state
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E', // Dark mode success
          600: '#16A34A', // Light mode success
          700: '#15803D',
          800: '#166534',
          900: '#052E16', // Dark mode state
        },
        // Amarelo/Laranja - Atenção, orçamento perto do limite (seguindo CORES.md)
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7', // Light mode state
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24', // Dark mode warning
          500: '#F59E0B', // Light mode warning
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#422006', // Dark mode state
        },
        // Laranja
        alert: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316', // Principal
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        // Vermelho - Gasto, dívida, limite estourado (seguindo CORES.md)
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2', // Light mode state
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171', // Dark mode error
          500: '#EF4444',
          600: '#DC2626', // Light mode error
          700: '#B91C1C',
          800: '#991B1B',
          900: '#450A0A', // Dark mode state
        },
        // Neutros (seguindo CORES.md)
        neutral: {
          50: '#F8FAFC', // Light mode bg.primary, Dark mode text.primary
          100: '#F1F5F9', // Light mode bg.hover
          200: '#E2E8F0',
          300: '#CBD5E1', // Dark mode text.secondary, Light mode border.divider
          400: '#94A3B8', // Light mode text.disabled
          500: '#64748B', // Dark mode text.disabled
          600: '#475569', // Light mode text.secondary
          700: '#334155', // Dark mode border.divider
          800: '#1E293B', // Dark mode bg.hover, Dark mode border.default
          900: '#0F172A', // Dark mode bg.secondary, Light mode text.highlight
          950: '#020617', // Dark mode bg.primary/bg.elevated, Light mode text.primary
        },
        // Info (seguindo CORES.md)
        info: {
          50: '#F0F9FF',
          100: '#E0F2FE', // Light mode state
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8', // Dark mode info
          500: '#0EA5E9', // Light mode info
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#082F49', // Dark mode state
        },
        // Bordas/divisores (seguindo CORES.md)
        border: {
          DEFAULT: '#E5E7EB', // Light mode border.default
          light: '#F3F4F6',
          dark: '#1E293B', // Dark mode border.default
          divider: '#CBD5E1', // Light mode border.divider
          'divider-dark': '#334155', // Dark mode border.divider
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        // Hierarquia tipográfica
        'display': ['40px', { lineHeight: '1.2', fontWeight: '700' }],
        'h1': ['32px', { lineHeight: '1.25', fontWeight: '700' }],
        'h2': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'h4': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '1.5' }],
        'body-sm': ['14px', { lineHeight: '1.5' }],
        'label': ['14px', { lineHeight: '1.4', fontWeight: '500' }],
        'caption': ['12px', { lineHeight: '1.4' }],
      },
      borderRadius: {
        'card': '12px',
        'card-lg': '16px',
        'button': '8px',
        'input': '8px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 150ms ease-out',
        'fade-out': 'fadeOut 150ms ease-out',
        'slide-in': 'slideIn 200ms ease-out',
        'slide-out': 'slideOut 200ms ease-out',
        'scale-in': 'scaleIn 150ms ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideOut: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(4px)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '250ms',
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}

