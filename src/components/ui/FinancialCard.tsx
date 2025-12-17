import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface FinancialCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  variant?: 'default' | 'success' | 'danger' | 'warning'
  trend?: {
    value: string
    isPositive: boolean
  }
}

export const FinancialCard = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  trend,
  className,
  ...props
}: FinancialCardProps) => {
  const valueColor = {
    default: 'text-neutral-950 dark:text-neutral-50',
    success: 'text-success-600 dark:text-success-500',
    danger: 'text-danger-600 dark:text-danger-400',
    warning: 'text-warning-500 dark:text-warning-400',
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-neutral-950 rounded-card-lg p-6 border border-border dark:border-border-dark shadow-card',
        'hover:shadow-card-hover hover:scale-[1.02] transition-all duration-fast',
        'animate-fade-in',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-label font-medium text-neutral-600 dark:text-neutral-300 mb-1">{title}</h3>
          {subtitle && (
            <p className="text-caption text-neutral-600 dark:text-neutral-300">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0">{icon}</div>
        )}
      </div>
      
      <div className="flex items-baseline gap-2 flex-wrap">
        <p className={cn('text-3xl font-bold tracking-tight', valueColor[variant])}>
          {typeof value === 'number' 
            ? new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(value)
            : value
          }
        </p>
        {trend && (
          <span
            className={cn(
              'text-body-sm font-semibold px-2 py-1 rounded-full',
              trend.isPositive 
                ? 'text-success-600 dark:text-success-500 bg-success-100 dark:bg-success-900' 
                : 'text-danger-600 dark:text-danger-400 bg-danger-100 dark:bg-danger-900'
            )}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
    </div>
  )
}

