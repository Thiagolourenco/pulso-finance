import { formatDate } from '@/lib/utils'
import {
  getCategorySpendingSourceLabel,
  type CategorySpendingItem,
} from '@/lib/utils/categorySpending'

interface CategorySpendingListProps {
  items: CategorySpendingItem[]
  monthSpent: number
  monthLabel: string
}

export const CategorySpendingList = ({
  items,
  monthSpent,
  monthLabel,
}: CategorySpendingListProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-body-sm font-semibold text-neutral-900 dark:text-neutral-50">
          Gastos em {monthLabel}
        </h4>
        <span className="text-body-sm font-bold text-danger-600 dark:text-danger-400">
          R$ {monthSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="p-4 rounded-lg border border-border dark:border-border-dark bg-neutral-50 dark:bg-neutral-900/30 text-center">
          <p className="text-body-sm text-neutral-500 dark:text-neutral-400">
            Nenhum gasto registrado nesta categoria neste mês.
          </p>
        </div>
      ) : (
        <div className="max-h-56 overflow-y-auto rounded-lg border border-border dark:border-border-dark divide-y divide-border dark:divide-border-dark">
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 p-3 bg-white dark:bg-neutral-900/40"
            >
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">
                  {item.description}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                  <span className="text-caption text-neutral-500 dark:text-neutral-400">
                    {formatDate(item.date)}
                  </span>
                  <span className="text-caption text-neutral-400 dark:text-neutral-500">•</span>
                  <span className="text-caption text-neutral-500 dark:text-neutral-400">
                    {getCategorySpendingSourceLabel(item.source)}
                  </span>
                  {item.detail && (
                    <>
                      <span className="text-caption text-neutral-400 dark:text-neutral-500">•</span>
                      <span className="text-caption text-neutral-500 dark:text-neutral-400">
                        {item.detail}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <span className="text-body-sm font-semibold text-danger-600 dark:text-danger-400 flex-shrink-0">
                R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
