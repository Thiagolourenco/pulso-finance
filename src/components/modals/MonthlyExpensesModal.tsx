import { Modal } from '@/components/ui'
import type { Transaction } from '@/types'
import type { Category } from '@/types'

interface MonthlyExpensesModalProps {
  isOpen: boolean
  onClose: () => void
  expenses: Transaction[]
  categories: Category[]
  monthName: string
  totalAmount: number
}

export const MonthlyExpensesModal = ({
  isOpen,
  onClose,
  expenses,
  categories,
  monthName,
  totalAmount,
}: MonthlyExpensesModalProps) => {
  // Agrupa despesas por categoria
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = categories.find(cat => cat.id === expense.category_id)
    const categoryName = category?.name || 'Sem categoria'
    
    if (!acc[categoryName]) {
      acc[categoryName] = {
        categoryName,
        categoryIcon: category?.icon || '📝',
        categoryColor: category?.color || '#95A5A6',
        expenses: [],
        total: 0,
      }
    }
    
    acc[categoryName].expenses.push(expense)
    acc[categoryName].total += Math.abs(Number(expense.amount) || 0)
    
    return acc
  }, {} as Record<string, {
    categoryName: string
    categoryIcon: string
    categoryColor: string
    expenses: Transaction[]
    total: number
  }>)

  const sortedCategories = Object.values(expensesByCategory).sort((a, b) => b.total - a.total)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Despesas de ${monthName}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Resumo total */}
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-danger-700 font-medium">Total de despesas:</span>
            <span className="text-h3 font-bold text-danger-700">
              R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-1 text-caption text-danger-600">
            {expenses.length} {expenses.length === 1 ? 'despesa' : 'despesas'}
          </div>
        </div>

        {/* Lista de despesas por categoria */}
        {sortedCategories.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <p className="text-body">Nenhuma despesa registrada neste mês</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedCategories.map((categoryGroup) => (
              <div key={categoryGroup.categoryName} className="border border-border rounded-lg overflow-hidden">
                {/* Header da categoria */}
                <div 
                  className="p-3 flex items-center justify-between"
                  style={{ backgroundColor: `${categoryGroup.categoryColor}15` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{categoryGroup.categoryIcon}</span>
                    <span className="text-body font-semibold text-neutral-900">
                      {categoryGroup.categoryName}
                    </span>
                  </div>
                  <span className="text-body-sm font-medium text-neutral-700">
                    R$ {categoryGroup.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Lista de despesas da categoria */}
                <div className="divide-y divide-border">
                  {categoryGroup.expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="p-3 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-body-sm font-medium text-neutral-900">
                            {expense.description || 'Sem descrição'}
                          </p>
                          <p className="text-caption text-neutral-500 mt-1">
                            {new Date(expense.date).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-body-sm font-semibold text-danger-600">
                            R$ {Math.abs(Number(expense.amount) || 0).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}


