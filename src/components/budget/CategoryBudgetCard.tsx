import { Card } from '@/components/ui'
import type { Category } from '@/types'

interface CategoryBudget {
  category: Category
  limit: number
  spent: number
  percentage: number
}

interface CategoryBudgetCardProps {
  budget: CategoryBudget
  onEditLimit?: (category: Category) => void
}

export const CategoryBudgetCard = ({ budget, onEditLimit }: CategoryBudgetCardProps) => {
  const { category, limit, spent, percentage } = budget
  const remaining = limit - spent
  const isOverLimit = spent > limit
  const isNearLimit = percentage >= 80 && !isOverLimit

  // Determina a cor baseada no status
  const getStatusColor = () => {
    if (isOverLimit) return 'danger'
    if (isNearLimit) return 'warning'
    return 'success'
  }

  const statusColor = getStatusColor()

  const handleClick = () => {
    if (onEditLimit) {
      onEditLimit(category)
    }
  }

  return (
    <Card 
      className={`p-4 hover:shadow-lg transition-shadow ${onEditLimit ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {category.icon && (
            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center text-xl flex-shrink-0">
              {category.icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-body-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">
              {category.name}
            </h3>
            <p className="text-caption text-neutral-500 dark:text-neutral-400 mt-0.5">
              {isOverLimit 
                ? `R$ ${Math.abs(remaining).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} acima do limite`
                : `R$ ${remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} restantes`
              }
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <span className={`text-body-sm font-bold ${
            statusColor === 'danger' 
              ? 'text-danger-600 dark:text-danger-400'
              : statusColor === 'warning'
              ? 'text-warning-600 dark:text-warning-400'
              : 'text-success-600 dark:text-success-400'
          }`}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mb-2">
        <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              statusColor === 'danger'
                ? 'bg-danger-500'
                : statusColor === 'warning'
                ? 'bg-warning-500'
                : 'bg-success-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Valores */}
      <div className="flex items-center justify-between text-caption">
        <span className="text-neutral-600 dark:text-neutral-400">
          Gasto: <span className="font-medium text-neutral-900 dark:text-neutral-50">
            R$ {spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </span>
        <div className="flex items-center gap-2">
          <span className="text-neutral-600 dark:text-neutral-400">
            Limite: <span className="font-medium text-neutral-900 dark:text-neutral-50">
              R$ {limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </span>
          {onEditLimit && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEditLimit(category)
              }}
              className="p-1 rounded hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors text-primary-600 dark:text-primary-400"
              title="Editar limite"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}

