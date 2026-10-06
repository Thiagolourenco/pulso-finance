import { Button, FinancialCard } from '@/components/ui'
import { formatCurrency, parseLocalDate } from '@/lib/utils'
import { isCompanyExpense, isPendingReimbursement } from '@/lib/utils/expenseOrigin'
import type { Account, Card, Transaction } from '@/types'

interface CompanyFinanceSectionProps {
  transactions: Transaction[]
  accounts: Account[]
  cards: Card[]
  currentMonth: number
  currentYear: number
  isReimbursing?: boolean
  onReimburse: (transaction: Transaction) => void
}

export const CompanyFinanceSection = ({
  transactions,
  accounts,
  cards,
  currentMonth,
  currentYear,
  isReimbursing = false,
  onReimburse,
}: CompanyFinanceSectionProps) => {
  const companyExpenses = transactions.filter(
    t => t.type === 'expense' && isCompanyExpense(t)
  )

  const companySpentThisMonth = companyExpenses
    .filter(t => {
      const date = parseLocalDate(t.date)
      return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear
    })
    .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0)

  const pending = companyExpenses.filter(isPendingReimbursement)
  const pendingTotal = pending.reduce(
    (sum, t) => sum + Math.abs(Number(t.amount) || 0),
    0
  )

  const reimbursedThisMonth = companyExpenses
    .filter(t => {
      if (t.reimbursement_status !== 'reimbursed') return false
      const date = parseLocalDate(t.updated_at || t.date)
      return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear
    })
    .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0)

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        <FinancialCard
          title="Gastos da empresa no mês"
          value={companySpentThisMonth}
          subtitle="Lançamentos marcados como empresa"
          variant="warning"
        />
        <FinancialCard
          title="A receber"
          value={pendingTotal}
          subtitle="Aguardando reembolso"
          variant="purple"
        />
        <FinancialCard
          title="Reembolsado no mês"
          value={reimbursedThisMonth}
          subtitle="Já marcados como reembolsados"
          variant="success"
        />
      </div>

      <div className="bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl rounded-card-lg border border-border dark:border-border-dark/70 overflow-hidden">
        <div className="px-4 py-3 border-b border-border dark:border-border-dark">
          <h2 className="text-h3 font-semibold text-neutral-900 dark:text-neutral-50">
            Pendentes de reembolso
          </h2>
          <p className="text-caption text-neutral-500 dark:text-neutral-400 mt-1">
            O valor já saiu da conta ou da fatura. Marque quando a empresa devolver.
          </p>
        </div>

        {pending.length === 0 ? (
          <div className="p-8 text-center text-body-sm text-neutral-500 dark:text-neutral-400">
            Nenhum gasto da empresa aguardando reembolso.
          </div>
        ) : (
          <div className="divide-y divide-border dark:divide-border-dark">
            {pending.map(transaction => {
              const account = accounts.find(a => a.id === transaction.account_id)
              const card = cards.find(c => c.id === transaction.card_id)
              return (
                <div
                  key={transaction.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-body font-medium text-neutral-900 dark:text-neutral-50 truncate">
                      {transaction.description}
                    </p>
                    <p className="text-caption text-neutral-500 dark:text-neutral-400 mt-1">
                      {parseLocalDate(transaction.date).toLocaleDateString('pt-BR')}
                      {account ? ` · ${account.name}` : ''}
                      {card ? ` · ${card.name}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-body font-bold tabular-nums text-warning-600 dark:text-warning-400">
                      {formatCurrency(Math.abs(Number(transaction.amount) || 0))}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isReimbursing}
                      onClick={() => onReimburse(transaction)}
                    >
                      Marcar reembolsado
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
