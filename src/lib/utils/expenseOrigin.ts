import { parseLocalDate } from '@/lib/utils'
import type { CardInvoice, CardPurchase, Transaction } from '@/types'

export type ExpenseOrigin = 'personal' | 'company'
export type FinanceView = 'personal' | 'company'
export type ReimbursementStatus = 'pending' | 'reimbursed'

type OriginFields = {
  origin?: string | null
  reimbursement_status?: string | null
}

export function getExpenseOrigin(item: OriginFields): ExpenseOrigin {
  return item.origin === 'company' ? 'company' : 'personal'
}

export function isCompanyExpense(item: OriginFields): boolean {
  return getExpenseOrigin(item) === 'company'
}

export function isPendingReimbursement(item: OriginFields): boolean {
  return isCompanyExpense(item) && item.reimbursement_status !== 'reimbursed'
}

/** Despesa que entra nos totais pessoais (exclui gastos da empresa). */
export function isPersonalPaidExpense(
  t: Pick<Transaction, 'type'> & OriginFields
): boolean {
  return t.type === 'expense' && !isCompanyExpense(t)
}

export function originFieldsForCreate(
  origin: ExpenseOrigin | undefined,
  type: 'expense' | 'income' | 'balance'
): { origin: ExpenseOrigin; reimbursement_status: ReimbursementStatus | null } {
  if (type === 'expense' && origin === 'company') {
    return { origin: 'company', reimbursement_status: 'pending' }
  }
  return { origin: 'personal', reimbursement_status: null }
}

export function isPurchaseInstallmentDueInMonth(
  purchase: Pick<CardPurchase, 'purchase_date' | 'current_installment' | 'installments'>,
  year: number,
  month: number
): boolean {
  if (purchase.current_installment > purchase.installments) return false
  const purchaseDate = parseLocalDate(purchase.purchase_date)
  const monthsDiff =
    (year - purchaseDate.getFullYear()) * 12 + (month - (purchaseDate.getMonth() + 1))
  return (
    monthsDiff >= 1 &&
    monthsDiff >= purchase.current_installment &&
    monthsDiff <= purchase.installments
  )
}

/** Parcela da empresa ainda a receber que entrou na fatura paga daquele vencimento. */
export function pendingCompanyInstallmentsForPaidInvoices(
  purchases: CardPurchase[],
  invoices: CardInvoice[],
  paidReferenceMonth: string
): number {
  const paidInvoices = invoices.filter(
    invoice =>
      invoice.status === 'paid' && invoice.last_paid_reference_month === paidReferenceMonth
  )

  return paidInvoices.reduce((sum, invoice) => {
    const due = parseLocalDate(invoice.due_date)
    const year = due.getFullYear()
    const month = due.getMonth() + 1
    const companyShare = purchases
      .filter(
        purchase =>
          purchase.card_id === invoice.card_id &&
          isPendingReimbursement(purchase) &&
          isPurchaseInstallmentDueInMonth(purchase, year, month)
      )
      .reduce((inner, purchase) => inner + (purchase.installment_amount || 0), 0)
    return sum + companyShare
  }, 0)
}
