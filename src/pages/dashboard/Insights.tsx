import { useTransactions } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import { useCardInvoices } from '@/hooks/useCardInvoices'
import { useCardPurchases } from '@/hooks/useCardPurchases'
import { useCategories } from '@/hooks/useCategories'
import { useRecurringExpenses } from '@/hooks/useRecurringExpenses'
import { InsightsCard } from '@/components/insights/InsightsCard'

export const Insights = () => {
  const { transactions } = useTransactions()
  const { accounts } = useAccounts()
  const { invoices } = useCardInvoices()
  const { purchases } = useCardPurchases()
  const { categories } = useCategories()
  const { expenses: recurringExpenses } = useRecurringExpenses()

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()
  
  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1
  const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear

  // Calcula receitas do mês atual
  const monthlyIncome = transactions
    .filter(transaction => {
      const transactionDate = new Date(transaction.date)
      return (
        transaction.type === 'income' &&
        transactionDate.getMonth() + 1 === currentMonth &&
        transactionDate.getFullYear() === currentYear
      )
    })
    .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0)

  // Calcula receitas do mês anterior
  const previousMonthIncome = transactions
    .filter(transaction => {
      const transactionDate = new Date(transaction.date)
      return (
        transaction.type === 'income' &&
        transactionDate.getMonth() + 1 === previousMonth &&
        transactionDate.getFullYear() === previousYear
      )
    })
    .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0)

  // Calcula despesas do mês atual
  const monthlyExpenses = transactions
    .filter(transaction => {
      const transactionDate = new Date(transaction.date)
      return (
        transaction.type === 'expense' &&
        transactionDate.getMonth() + 1 === currentMonth &&
        transactionDate.getFullYear() === currentYear
      )
    })
    .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount) || 0), 0)

  // Calcula despesas do mês anterior
  const previousMonthExpenses = transactions
    .filter(transaction => {
      const transactionDate = new Date(transaction.date)
      return (
        transaction.type === 'expense' &&
        transactionDate.getMonth() + 1 === previousMonth &&
        transactionDate.getFullYear() === previousYear
      )
    })
    .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount) || 0), 0)

  // Calcula saldo total
  const totalBalance = accounts.reduce((sum, account) => sum + (account.current_balance || 0), 0)

  // Calcula investimentos
  const investmentAccounts = accounts.filter(account => account.type === 'investment')
  const totalInvestments = investmentAccounts.reduce((sum, account) => sum + (account.current_balance || 0), 0)

  // Calcula sobra prevista
  const expectedSurplus = monthlyIncome - monthlyExpenses
  const previousMonthSurplus = previousMonthIncome - previousMonthExpenses

  // Próximo mês
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
  const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear

  // Despesas do próximo mês (transações já registradas)
  const nextMonthExpenses = transactions
    .filter(transaction => {
      const transactionDate = new Date(transaction.date)
      return (
        transaction.type === 'expense' &&
        transactionDate.getMonth() + 1 === nextMonth &&
        transactionDate.getFullYear() === nextMonthYear
      )
    })
    .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount) || 0), 0)

  // Parcelas fixas do próximo mês
  const nextMonthFixedPurchases = purchases.filter(purchase => {
    if (purchase.current_installment > purchase.installments) return false
    const purchaseDate = new Date(purchase.purchase_date)
    const purchaseMonth = purchaseDate.getMonth() + 1
    const purchaseYear = purchaseDate.getFullYear()
    const monthsDiff = (nextMonthYear - purchaseYear) * 12 + (nextMonth - purchaseMonth)
    const installmentToPay = monthsDiff + 1
    return (
      monthsDiff >= 0 &&
      installmentToPay >= purchase.current_installment &&
      installmentToPay <= purchase.installments
    )
  })
  const nextMonthFixedExpenses = nextMonthFixedPurchases.reduce((sum, purchase) => sum + (purchase.installment_amount || 0), 0)

  // Despesas recorrentes do próximo mês
  const nextMonthRecurringExpenses = recurringExpenses
    .filter(expense => expense.is_active)
    .reduce((sum, expense) => sum + (expense.amount || 0), 0)

  // Faturas do próximo mês
  const nextMonthInvoices = invoices.filter(invoice => {
    if (invoice.status !== 'open') return false
    const invoiceDueDate = new Date(invoice.due_date)
    const invoiceMonth = invoiceDueDate.getMonth() + 1
    const invoiceYear = invoiceDueDate.getFullYear()
    return invoiceMonth === nextMonth && invoiceYear === nextMonthYear
  })
  const nextMonthInvoiceExpenses = nextMonthInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0)

  // Top 5 despesas
  const topExpenses = transactions
    .filter(t => t.type === 'expense')
    .map(t => {
      const category = categories.find(c => c.id === t.category_id)
      return {
        description: t.description,
        amount: Math.abs(Number(t.amount) || 0),
        category: category?.name
      }
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-border dark:border-border-dark">
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-neutral-50 mb-2">Insights</h1>
        <p className="text-body-sm text-neutral-500 dark:text-neutral-400">
          Análises inteligentes sobre suas finanças
        </p>
      </div>

      {/* Card de Insights Inteligentes */}
      <div className="mb-8">
        <InsightsCard
          monthlyData={{
            income: monthlyIncome,
            expenses: monthlyExpenses,
            balance: totalBalance,
            investments: totalInvestments,
            nextMonthExpenses,
            nextMonthFixedExpenses,
            nextMonthRecurringExpenses,
            nextMonthInvoiceExpenses,
            previousMonthIncome,
            previousMonthExpenses,
            expectedSurplus,
            previousMonthSurplus,
            recurringExpenses: recurringExpenses.filter(e => e.is_active).map(e => ({
              name: e.name,
              amount: e.amount,
              due_day: e.due_day
            })),
            topExpenses,
            monthName: new Date(currentYear, currentMonth - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
            nextMonthName: new Date(nextMonthYear, nextMonth - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
          }}
        />
      </div>

      {/* Resumo Mensal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl rounded-card-lg border border-border dark:border-border-dark/70">
          <p className="text-caption text-neutral-600 dark:text-neutral-300 mb-2">Receitas do Mês</p>
          <p className="text-h2 font-bold text-success-600">
            R$ {monthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          {previousMonthIncome > 0 && (
            <p className="text-caption text-neutral-500 dark:text-neutral-400 mt-1">
              {previousMonthIncome > monthlyIncome ? '↓' : '↑'} {Math.abs(((monthlyIncome - previousMonthIncome) / previousMonthIncome) * 100).toFixed(1)}% vs mês anterior
            </p>
          )}
        </div>
        <div className="p-6 bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl rounded-card-lg border border-border dark:border-border-dark/70">
          <p className="text-caption text-neutral-600 dark:text-neutral-300 mb-2">Despesas do Mês</p>
          <p className="text-h2 font-bold text-danger-600">
            R$ {monthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          {previousMonthExpenses > 0 && (
            <p className="text-caption text-neutral-500 dark:text-neutral-400 mt-1">
              {previousMonthExpenses > monthlyExpenses ? '↓' : '↑'} {Math.abs(((monthlyExpenses - previousMonthExpenses) / previousMonthExpenses) * 100).toFixed(1)}% vs mês anterior
            </p>
          )}
        </div>
        <div className="p-6 bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl rounded-card-lg border border-border dark:border-border-dark/70">
          <p className="text-caption text-neutral-600 dark:text-neutral-300 mb-2">Sobra Prevista</p>
          <p className={`text-h2 font-bold ${expectedSurplus >= 0 ? 'text-success-600 dark:text-success-500' : 'text-danger-600 dark:text-danger-400'}`}>
            {expectedSurplus >= 0 ? '+' : ''}R$ {expectedSurplus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          {previousMonthSurplus !== 0 && (
            <p className="text-caption text-neutral-500 dark:text-neutral-400 mt-1">
              {previousMonthSurplus > expectedSurplus ? '↓' : '↑'} {Math.abs(((expectedSurplus - previousMonthSurplus) / Math.abs(previousMonthSurplus)) * 100).toFixed(1)}% vs mês anterior
            </p>
          )}
        </div>
        <div className="p-6 bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl rounded-card-lg border border-border dark:border-border-dark/70">
          <p className="text-caption text-neutral-600 dark:text-neutral-300 mb-2">Investimentos</p>
          <p className="text-h2 font-bold text-primary-600 dark:text-primary-400">
            R$ {totalInvestments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Top 5 Despesas */}
      <div className="p-6 bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl rounded-card-lg border border-border dark:border-border-dark/70">
        <h2 className="text-h3 font-semibold text-neutral-900 dark:text-neutral-50 mb-4">Top 5 Despesas</h2>
        {topExpenses.length > 0 ? (
          <div className="space-y-3">
            {topExpenses.map((expense, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-950/30 rounded-lg border border-border dark:border-border-dark/70"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center">
                    <span className="text-body font-bold text-primary-600 dark:text-primary-400">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50">{expense.description}</p>
                    <p className="text-caption text-neutral-500 dark:text-neutral-400">
                      {expense.category || 'Sem categoria'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-body font-bold text-danger-600 dark:text-danger-400">
                    R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-300">
            <p>Nenhuma despesa registrada ainda</p>
          </div>
        )}
      </div>
    </div>
  )
}
