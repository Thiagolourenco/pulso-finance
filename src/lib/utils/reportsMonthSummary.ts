import type { CardInvoice, RecurringExpense, Transaction } from '@/types'
import { parseLocalDate } from '@/lib/utils'

export type ReportsMonthSummary = {
  totalIncome: number
  totalExpenses: number
  totalBalance: number
  transactionCount: number
}

/** Mesma lógica da página Relatórios (período = um mês civil). */
export function getReportsMonthSummary(
  transactions: Transaction[],
  invoices: CardInvoice[],
  recurringExpenses: RecurringExpense[],
  year: number,
  month: number
): ReportsMonthSummary {
  const periodBoundsStart = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const periodBoundsEnd = new Date(year, month, 0, 23, 59, 59, 999)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isViewingLiveCalendarMonth =
    month === today.getMonth() + 1 && year === today.getFullYear()

  const periodTransactions = transactions.filter(t => {
    // parseLocalDate evita "YYYY-MM-DD" virar o dia anterior no fuso BR (UTC vs local)
    const transactionDate = parseLocalDate(t.date)
    transactionDate.setHours(0, 0, 0, 0)
    return transactionDate >= periodBoundsStart && transactionDate <= periodBoundsEnd
  })

  const totalIncome = periodTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  const transactionExpenses = periodTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0)

  const periodInvoiceTotal = invoices
    .filter(invoice => {
      const invoiceDate = parseLocalDate(invoice.due_date)
      invoiceDate.setHours(0, 0, 0, 0)
      const isInRange = invoiceDate >= periodBoundsStart && invoiceDate <= periodBoundsEnd
      const isOverdueOpen =
        isViewingLiveCalendarMonth &&
        invoice.status === 'open' &&
        invoiceDate <= today &&
        (invoice.total_amount || 0) > 0
      return isInRange || isOverdueOpen
    })
    .reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0)

  const monthsInPeriod: { year: number; monthIndex: number }[] = []
  const cur = new Date(periodBoundsStart.getFullYear(), periodBoundsStart.getMonth(), 1)
  const endMarker = new Date(periodBoundsEnd.getFullYear(), periodBoundsEnd.getMonth(), 1)
  while (cur <= endMarker) {
    monthsInPeriod.push({ year: cur.getFullYear(), monthIndex: cur.getMonth() })
    cur.setMonth(cur.getMonth() + 1)
  }

  const activeRecurring = recurringExpenses.filter(e => e.is_active)
  const periodRecurringTotal =
    activeRecurring.length === 0
      ? 0
      : monthsInPeriod.reduce((sum, { year: y, monthIndex: mi }) => {
          const monthTotal = activeRecurring.reduce((monthSum, expense) => {
            const dueDate = new Date(y, mi, expense.due_day)
            if (dueDate.getMonth() !== mi || dueDate.getFullYear() !== y) return monthSum
            return monthSum + (expense.amount || 0)
          }, 0)
          return sum + monthTotal
        }, 0)

  const totalExpenses = transactionExpenses + periodInvoiceTotal + periodRecurringTotal
  const totalBalance = totalIncome - totalExpenses

  return {
    totalIncome,
    totalExpenses,
    totalBalance,
    transactionCount: periodTransactions.length,
  }
}
