import { Modal } from '@/components/ui'
import { isPurchaseBilledInInvoiceMonth } from '@/lib/utils/cardInvoiceCycle'
import { parseLocalDate } from '@/lib/utils'
import type { Transaction, Category, CardInvoice, RecurringExpense, Card, CardPurchase } from '@/types'

interface MonthlyExpensesModalProps {
  isOpen: boolean
  onClose: () => void
  expenses: Transaction[]
  categories: Category[]
  monthName: string
  totalAmount: number
  cardInvoices?: CardInvoice[]
  recurringExpensesList?: RecurringExpense[]
  cards?: Card[]
  cardPurchases?: CardPurchase[]
}

export const MonthlyExpensesModal = ({
  isOpen,
  onClose,
  expenses,
  categories,
  monthName,
  totalAmount,
  cardInvoices = [],
  recurringExpensesList = [],
  cards = [],
  cardPurchases = [],
}: MonthlyExpensesModalProps) => {
  const hasCardInvoices = cardInvoices.length > 0
  const hasRecurring = recurringExpensesList.length > 0

  const purchasesForInvoice = (invoice: CardInvoice) => {
    const due = parseLocalDate(invoice.due_date)
    const month = due.getMonth() + 1
    const year = due.getFullYear()

    return cardPurchases
      .filter(
        purchase =>
          purchase.card_id === invoice.card_id &&
          isPurchaseBilledInInvoiceMonth(purchase, month, year)
      )
      .sort((a, b) => (b.installment_amount || 0) - (a.installment_amount || 0))
  }

  const creditItemCount = cardInvoices.reduce(
    (sum, invoice) => sum + purchasesForInvoice(invoice).length,
    0
  )

  // Agrupa despesas por categoria (só transações)
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
        {/* Resumo total = soma dos gastos e faturas pagas este mês */}
        <div className="p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-danger-700 dark:text-danger-200 font-medium">Total de despesas (gastos e faturas pagas):</span>
            <span className="text-h3 font-bold text-danger-700 dark:text-danger-200">
              R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-1 text-caption text-danger-600 dark:text-danger-200/80">
            {expenses.length + cardInvoices.length + recurringExpensesList.length + creditItemCount} itens (transações + faturas, lançamentos no crédito e recorrentes)
          </div>
        </div>

        {/* Cartão de crédito */}
        {hasCardInvoices && (
          <div className="border border-border dark:border-border-dark rounded-lg overflow-hidden">
            <div className="p-3 flex items-center justify-between bg-primary-50 dark:bg-primary-500/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">💳</span>
                <span className="text-body font-semibold text-neutral-900 dark:text-neutral-50">
                  Cartão de crédito
                </span>
              </div>
              <span className="text-body-sm font-medium text-neutral-700 dark:text-neutral-200">
                R$ {cardInvoices.reduce((s, inv) => s + (inv.total_amount || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="divide-y divide-border dark:divide-border-dark">
              {cardInvoices.map((invoice) => {
                const card = cards.find(c => c.id === invoice.card_id)
                const isPaid = invoice.status === 'paid'
                const lineItems = purchasesForInvoice(invoice)
                const due = parseLocalDate(invoice.due_date)
                return (
                  <div key={invoice.id}>
                    <div className="p-3 hover:bg-neutral-50 dark:hover:bg-neutral-950/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50">
                            {card?.name ?? 'Cartão'} · Vence {due.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-caption text-neutral-500 dark:text-neutral-400 mt-1">
                            {isPaid ? 'Paga' : 'A pagar'}
                          </p>
                        </div>
                        <p className="text-body-sm font-semibold text-danger-600 dark:text-danger-400">
                          R$ {(invoice.total_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    {lineItems.length > 0 && (
                      <div className="border-t border-border dark:border-border-dark divide-y divide-border dark:divide-border-dark bg-neutral-50/80 dark:bg-neutral-950/40">
                        {lineItems.map((purchase) => {
                          const category = categories.find(c => c.id === purchase.category_id)
                          const purchaseDate = parseLocalDate(purchase.purchase_date)
                          const installmentNumber =
                            (due.getFullYear() - purchaseDate.getFullYear()) * 12 +
                            (due.getMonth() - purchaseDate.getMonth())
                          const detail = purchase.is_recurring
                            ? 'Recorrente'
                            : purchase.installments > 1
                              ? `Parcela ${installmentNumber}/${purchase.installments}`
                              : null

                          return (
                            <div key={purchase.id} className="px-3 py-2.5 pl-8">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <p className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">
                                      {purchase.description || 'Sem descrição'}
                                    </p>
                                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
                                      CREDITO
                                    </span>
                                  </div>
                                  <p className="text-caption text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    {[category?.name, detail].filter(Boolean).join(' · ') || 'Lançamento no cartão'}
                                  </p>
                                </div>
                                <p className="text-body-sm font-semibold text-danger-600 dark:text-danger-400 shrink-0">
                                  R$ {(purchase.installment_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Financiamento / Recorrentes */}
        {hasRecurring && (
          <div className="border border-border dark:border-border-dark rounded-lg overflow-hidden">
            <div className="p-3 flex items-center justify-between bg-warning-50 dark:bg-warning-500/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔄</span>
                <span className="text-body font-semibold text-neutral-900 dark:text-neutral-50">
                  Financiamento / Recorrentes
                </span>
              </div>
              <span className="text-body-sm font-medium text-neutral-700 dark:text-neutral-200">
                R$ {recurringExpensesList.reduce((s, e) => s + (e.amount || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="divide-y divide-border dark:divide-border-dark">
              {recurringExpensesList.map((expense) => {
                const category = categories.find(c => c.id === expense.category_id)
                return (
                  <div key={expense.id} className="p-3 hover:bg-neutral-50 dark:hover:bg-neutral-950/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50">
                          {expense.name || 'Recorrente'} · {category?.name ?? 'Outros'}
                        </p>
                        <p className="text-caption text-neutral-500 dark:text-neutral-400 mt-1">
                          Vence dia {expense.due_day}
                        </p>
                      </div>
                      <p className="text-body-sm font-semibold text-danger-600 dark:text-danger-400">
                        R$ {(expense.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Lista de despesas por categoria (transações) */}
        {sortedCategories.length === 0 && !hasCardInvoices && !hasRecurring ? (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-300">
            <p className="text-body">Nenhuma despesa registrada neste mês</p>
          </div>
        ) : sortedCategories.length > 0 ? (
          <div className="space-y-4">
            <div className="text-body font-semibold text-neutral-700 dark:text-neutral-300 mt-2">Transações</div>
            {sortedCategories.map((categoryGroup) => (
              <div key={categoryGroup.categoryName} className="border border-border dark:border-border-dark rounded-lg overflow-hidden">
                {/* Header da categoria */}
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

                {/* Lista de despesas da categoria */}
                <div className="divide-y divide-border dark:divide-border-dark">
                  {categoryGroup.expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="p-3 hover:bg-neutral-50 dark:hover:bg-neutral-950/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50">
                            {expense.description || 'Sem descrição'}
                          </p>
                          <p className="text-caption text-neutral-500 dark:text-neutral-400 mt-1">
                            {parseLocalDate(expense.date).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-body-sm font-semibold text-danger-600 dark:text-danger-400">
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
        ) : null}
      </div>
    </Modal>
  )
}


