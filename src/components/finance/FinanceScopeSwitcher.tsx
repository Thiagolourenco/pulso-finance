import { cn } from '@/lib/utils'
import type { FinanceView } from '@/lib/utils/expenseOrigin'

interface FinanceScopeSwitcherProps {
  value: FinanceView
  onChange: (value: FinanceView) => void
  className?: string
}

export const FinanceScopeSwitcher = ({
  value,
  onChange,
  className,
}: FinanceScopeSwitcherProps) => {
  return (
    <div
      className={cn(
        'inline-flex rounded-input border-2 border-border dark:border-border-dark p-1 bg-white dark:bg-neutral-950/40',
        className
      )}
      role="tablist"
      aria-label="Visão financeira"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === 'personal'}
        onClick={() => onChange('personal')}
        className={cn(
          'px-4 py-2 rounded-md text-body-sm font-medium transition-all duration-fast',
          value === 'personal'
            ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-sm'
            : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        )}
      >
        Pessoal
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'company'}
        onClick={() => onChange('company')}
        className={cn(
          'px-4 py-2 rounded-md text-body-sm font-medium transition-all duration-fast',
          value === 'company'
            ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-sm'
            : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        )}
      >
        Empresa
      </button>
    </div>
  )
}
