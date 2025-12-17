import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-label font-medium text-neutral-950 dark:text-neutral-50 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'w-full px-4 py-2.5 text-body bg-white dark:bg-neutral-950 border rounded-input',
            'text-neutral-950 dark:text-neutral-50',
            'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
            'focus:outline-none focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-400 focus:border-primary-600 dark:focus:border-primary-400',
            'transition-all duration-fast',
            error
              ? 'border-danger-600 dark:border-danger-400 focus:ring-danger-600 dark:focus:ring-danger-400 focus:border-danger-600 dark:focus:border-danger-400'
              : 'border-border dark:border-border-dark hover:border-neutral-300 dark:hover:border-neutral-700',
            'disabled:bg-neutral-100 dark:disabled:bg-neutral-900 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-caption text-danger-600 dark:text-danger-400 animate-shake">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-caption text-neutral-500 dark:text-neutral-400">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

