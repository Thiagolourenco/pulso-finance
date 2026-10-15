import { useState } from 'react'
import { Modal } from '@/components/ui'
import { parseLocalDate } from '@/lib/utils'
import type { Transaction, CardPurchase, RecurringExpense, Category, Card } from '@/types'

interface NextMonthExpensesModalProps {
  isOpen: boolean
  onClose: () => void
  nextMonthExpenses: number
  nextMonthFixedExpenses: number
  nextMonthRecurringExpenses: number
  totalNextMonth: number
  fixedExpensesDetails?: CardPurchase[]
  recurringExpensesDetails?: RecurringExpense[]
  transactionsDetails?: Transaction[]
  nextMonthName: string
  categories?: Category[]
  cards?: Card[]
  onDeletePurchase?: (purchase: CardPurchase) => Promise<void>
}

export const NextMonthExpensesModal = ({
  isOpen,
  onClose,
  nextMonthExpenses,
  nextMonthFixedExpenses,
  nextMonthRecurringExpenses,
  totalNextMonth,
  fixedExpensesDetails = [],
  recurringExpensesDetails = [],
  transactionsDetails = [],
  nextMonthName,
  categories = [],
  cards = [],
  onDeletePurchase,
}: NextMonthExpensesModalProps) => {
  const [activeTab, setActiveTab] = useState<'installments' | 'recurring'>('installments')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const purchasesByCategory = fixedExpensesDetails.reduce((acc, purchase) => {
    const category = categories.find(item => item.id === purchase.category_id)
    const categoryName = category?.name || 'Sem categoria'
    if (!acc[categoryName]) {
      acc[categoryName] = {
        categoryName,
        categoryIcon: category?.icon || '💳',
        categoryColor: category?.color || '#95A5A6',
        purchases: [],
        total: 0,
      }
    }
    acc[categoryName].purchases.push(purchase)
    acc[categoryName].total += purchase.installment_amount || 0
    return acc
  }, {} as Record<string, {
    categoryName: string
    categoryIcon: string
    categoryColor: string
    purchases: CardPurchase[]
    total: number
  }>)

  const sortedPurchaseCategories = Object.values(purchasesByCategory).sort((a, b) => b.total - a.total)

  const handleDeletePurchase = async (purchase: CardPurchase) => {
    if (!onDeletePurchase || deletingId) return
    const confirmed = confirm(
      `Excluir "${purchase.description}"? A compra sai do cartão e da previsão do próximo mês.`
    )
    if (!confirmed) return

    setDeletingId(purchase.id)
    try {
      await onDeletePurchase(purchase)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Despesas de ${nextMonthName}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Resumo */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-white dark:bg-neutral-900/30 rounded-lg border border-border dark:border-border-dark/70">
            <p className="text-caption text-neutral-600 dark:text-neutral-300 mb-1">Valor já gasto</p>
            <p className="text-body font-bold text-danger-600 dark:text-danger-400">
              R$ {nextMonthExpenses.toLocaleString('pt-BR', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-neutral-900/30 rounded-lg border border-border dark:border-border-dark/70">
            <p className="text-caption text-neutral-600 dark:text-neutral-300 mb-1">Valores fixos</p>
            <p className="text-body font-bold text-warning-600 dark:text-warning-400">
              R$ {(nextMonthFixedExpenses + nextMonthRecurringExpenses).toLocaleString('pt-BR', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </p>
          </div>
          <div className="p-4 bg-danger-50 dark:bg-danger-900/20 rounded-lg border-2 border-danger-200 dark:border-danger-700/50">
            <p className="text-caption text-neutral-700 dark:text-neutral-200 mb-1 font-medium">Total previsto</p>
            <p className="text-h3 font-bold text-danger-600 dark:text-danger-200">
              R$ {totalNextMonth.toLocaleString('pt-BR', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </p>
          </div>
        </div>

        {/* Despesas já registradas */}
        {transactionsDetails.length > 0 && (
          <div>
            <h3 className="text-body font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
              Despesas já registradas ({transactionsDetails.length})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {transactionsDetails.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-3 bg-white dark:bg-neutral-900/30 rounded-lg border border-border dark:border-border-dark/70 flex items-center justify-between"
                >
                  <div>
                    <p className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {transaction.description}
                    </p>
                    <p className="text-caption text-neutral-500 dark:text-neutral-400">
                      {parseLocalDate(transaction.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <p className="text-body font-semibold text-danger-600 dark:text-danger-400">
                    R$ {Math.abs(Number(transaction.amount)).toLocaleString('pt-BR', { 
                      minimumFractionDigits: 2 
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu de tabs */}
        <div className="flex gap-2 border-b border-border dark:border-border-dark">
          <button
            onClick={() => setActiveTab('installments')}
            className={`px-4 py-2 text-body-sm font-medium transition-colors border-b-2 ${
              activeTab === 'installments'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            Parcelas ({fixedExpensesDetails.length})
          </button>
          <button
            onClick={() => setActiveTab('recurring')}
            className={`px-4 py-2 text-body-sm font-medium transition-colors border-b-2 ${
              activeTab === 'recurring'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            Recorrentes ({recurringExpensesDetails.length})
          </button>
        </div>

        {/* Conteúdo das tabs */}
        {activeTab === 'installments' && (
          <div>
            {sortedPurchaseCategories.length > 0 ? (
              <div className="space-y-4">
                {sortedPurchaseCategories.map((categoryGroup) => (
                  <div key={categoryGroup.categoryName} className="border border-border dark:border-border-dark rounded-lg overflow-hidden">
                    <div
                      className="p-3 flex items-center justify-between"
                      style={{ backgroundColor: `${categoryGroup.categoryColor}15` }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{categoryGroup.categoryIcon}</span>
                        <span className="text-body font-semibold text-neutral-900 dark:text-neutral-50">
                          {categoryGroup.categoryName}
                        </span>
                      </div>
                      <span className="text-body-sm font-medium text-neutral-700 dark:text-neutral-200">
                        R$ {categoryGroup.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="divide-y divide-border dark:divide-border-dark">
                      {categoryGroup.purchases.map((purchase) => {
                        const card = cards.find(item => item.id === purchase.card_id)
                        return (
                          <div key={purchase.id} className="p-3 flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <p className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">
                                  {purchase.description}
                                </p>
                                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
                                  CREDITO
                                </span>
                              </div>
                              <p className="text-caption text-neutral-500 dark:text-neutral-400 mt-0.5">
                                Parcela {purchase.current_installment}/{purchase.installments}
                                {card ? ` · ${card.name}` : ''}
                                {' · '}
                                Comprado em {parseLocalDate(purchase.purchase_date).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <p className="text-body font-semibold text-warning-600 dark:text-warning-400">
                                R$ {purchase.installment_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              {onDeletePurchase && (
                                <button
                                  type="button"
                                  onClick={() => handleDeletePurchase(purchase)}
                                  disabled={deletingId === purchase.id}
                                  className="text-caption font-medium text-danger-600 dark:text-danger-400 hover:underline disabled:opacity-50"
                                >
                                  {deletingId === purchase.id ? 'Excluindo…' : 'Excluir'}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-neutral-50 dark:bg-neutral-900/20 rounded-lg border border-border dark:border-border-dark">
                <p className="text-body-sm text-neutral-500 dark:text-neutral-300">
                  Nenhuma parcela prevista para o próximo mês
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recurring' && (
          <div>
            {recurringExpensesDetails.length > 0 ? (
              <>
                <h3 className="text-body font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
                  Despesas recorrentes ({recurringExpensesDetails.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recurringExpensesDetails.map((expense) => {
                    const nextDueDate = (() => {
                      const today = new Date()
                      const currentMonth = today.getMonth()
                      const currentYear = today.getFullYear()
                      let dueDate = new Date(currentYear, currentMonth, expense.due_day)
                      if (dueDate < today) {
                        dueDate = new Date(currentYear, currentMonth + 1, expense.due_day)
                      }
                      return dueDate
                    })()

                    return (
                      <div
                        key={expense.id}
                        className="p-3 bg-white dark:bg-neutral-900/30 rounded-lg border border-border dark:border-border-dark/70 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50">
                            {expense.name}
                          </p>
                          <p className="text-caption text-neutral-500 dark:text-neutral-400">
                            Vence dia {expense.due_day} • Próximo: {nextDueDate.toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <p className="text-body font-semibold text-warning-600 dark:text-warning-400">
                          R$ {expense.amount.toLocaleString('pt-BR', { 
                            minimumFractionDigits: 2 
                          })}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="p-8 text-center bg-neutral-50 dark:bg-neutral-900/20 rounded-lg border border-border dark:border-border-dark">
                <p className="text-body-sm text-neutral-500 dark:text-neutral-300">
                  Nenhuma despesa recorrente prevista para o próximo mês
                </p>
              </div>
            )}
          </div>
        )}

        {transactionsDetails.length === 0 && fixedExpensesDetails.length === 0 && recurringExpensesDetails.length === 0 && (
          <div className="p-8 text-center bg-neutral-50 dark:bg-neutral-900/20 rounded-lg border border-border dark:border-border-dark">
            <p className="text-body-sm text-neutral-500 dark:text-neutral-300">
              Nenhuma despesa prevista para o próximo mês
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}

