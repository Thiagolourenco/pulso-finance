import { parseLocalDate } from '@/lib/utils'
import type { CardPurchase, RecurringExpense, Transaction } from '@/types'

export type CategorySpendingSource = 'transaction' | 'card_purchase' | 'recurring'

export interface CategorySpendingItem {
  id: string
  description: string
  amount: number
  date: string
  source: CategorySpendingSource
  detail?: string
}

const SOURCE_LABELS: Record<CategorySpendingSource, string> = {
  transaction: 'Transação',
  card_purchase: 'Cartão',
  recurring: 'Recorrente',
}

export const getCategorySpendingSourceLabel = (source: CategorySpendingSource) =>
  SOURCE_LABELS[source]

export const getCategorySpendingItems = (
  categoryId: string,
  transactions: Transaction[],
  cardPurchases: CardPurchase[],
  recurringExpenses: RecurringExpense[],
  month: number,
  year: number
): CategorySpendingItem[] => {
  const items: CategorySpendingItem[] = []

  transactions
    .filter(t => {
      if (t.category_id !== categoryId || t.type !== 'expense') return false
      const transactionDate = parseLocalDate(t.date)
      return (
        transactionDate.getMonth() + 1 === month &&
        transactionDate.getFullYear() === year
      )
    })
    .forEach(t => {
      items.push({
        id: `transaction-${t.id}`,
        description: t.description,
        amount: Math.abs(Number(t.amount) || 0),
        date: t.date,
        source: 'transaction',
      })
    })

  cardPurchases
    .filter(p => {
      if (p.category_id !== categoryId) return false

      const purchaseDate = parseLocalDate(p.purchase_date)
      const purchaseMonth = purchaseDate.getMonth() + 1
      const purchaseYear = purchaseDate.getFullYear()
      const monthsDiff = (year - purchaseYear) * 12 + (month - purchaseMonth)
      const installmentDueThisMonth = monthsDiff

      return (
        monthsDiff >= 1 &&
        installmentDueThisMonth >= p.current_installment &&
        installmentDueThisMonth <= p.installments
      )
    })
    .forEach(p => {
      const purchaseDate = parseLocalDate(p.purchase_date)
      const purchaseMonth = purchaseDate.getMonth() + 1
      const purchaseYear = purchaseDate.getFullYear()
      const installmentDueThisMonth =
        (year - purchaseYear) * 12 + (month - purchaseMonth)

      items.push({
        id: `purchase-${p.id}-${installmentDueThisMonth}`,
        description: p.description,
        amount: p.installment_amount || 0,
        date: p.purchase_date,
        source: 'card_purchase',
        detail: `Parcela ${installmentDueThisMonth}/${p.installments}`,
      })
    })

  recurringExpenses
    .filter(expense => {
      if (!expense.is_active || expense.category_id !== categoryId) return false
      const dueDate = new Date(year, month - 1, expense.due_day)
      return dueDate.getMonth() + 1 === month && dueDate.getFullYear() === year
    })
    .forEach(expense => {
      const dueDate = new Date(year, month - 1, expense.due_day)
      items.push({
        id: `recurring-${expense.id}`,
        description: expense.name,
        amount: expense.amount || 0,
        date: dueDate.toISOString().split('T')[0],
        source: 'recurring',
        detail: `Vence dia ${expense.due_day}`,
      })
    })

  return items.sort(
    (a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime()
  )
}

export const calculateCategorySpending = (
  categoryId: string,
  transactions: Transaction[],
  cardPurchases: CardPurchase[],
  recurringExpenses: RecurringExpense[],
  month: number,
  year: number
): number =>
  getCategorySpendingItems(
    categoryId,
    transactions,
    cardPurchases,
    recurringExpenses,
    month,
    year
  ).reduce((sum, item) => sum + item.amount, 0)

export interface CategoryMonthTotal {
  year: number
  month: number
  monthLabel: string
  amount: number
  changePercent: number | null
}

export const getCategoryMonthlyComparison = (
  categoryId: string,
  transactions: Transaction[],
  cardPurchases: CardPurchase[],
  recurringExpenses: RecurringExpense[],
  months: { year: number; month: number }[]
): CategoryMonthTotal[] => {
  const totals = months.map(({ year, month }) => {
    const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', {
      month: 'short',
      year: '2-digit',
    })
    const amount = calculateCategorySpending(
      categoryId,
      transactions,
      cardPurchases,
      recurringExpenses,
      month,
      year
    )

    return {
      year,
      month,
      monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
      amount,
      changePercent: null as number | null,
    }
  })

  return totals.map((entry, index) => {
    if (index === 0) return entry

    const previousAmount = totals[index - 1].amount
    const changePercent =
      previousAmount > 0
        ? ((entry.amount - previousAmount) / previousAmount) * 100
        : entry.amount > 0
          ? 100
          : 0

    return { ...entry, changePercent }
  })
}

export const getLastMonths = (count: number, fromDate: Date = new Date()) => {
  const months: { year: number; month: number }[] = []
  const base = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1)

  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(base.getFullYear(), base.getMonth() - i, 1)
    months.push({ year: date.getFullYear(), month: date.getMonth() + 1 })
  }

  return months
}
