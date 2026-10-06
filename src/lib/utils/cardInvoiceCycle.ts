export interface CardBillingDays {
  closing_day: number
  due_day: number
}

export interface InvoiceCycleDates {
  reference_month: string
  closing_date: string
  due_date: string
}

const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Calcula datas do ciclo de fatura com base na data da compra e nos dias do cartão. */
export const getInvoiceCycleDates = (
  card: CardBillingDays,
  purchaseDate?: string | Date
): InvoiceCycleDates => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const purchaseDateObj =
    purchaseDate == null
      ? today
      : typeof purchaseDate === 'string'
        ? new Date(purchaseDate + 'T12:00:00')
        : new Date(purchaseDate)
  purchaseDateObj.setHours(0, 0, 0, 0)

  const referenceDate = purchaseDateObj < today ? today : purchaseDateObj
  const referenceMonth = referenceDate.getMonth()
  const referenceYear = referenceDate.getFullYear()

  const closingDate = new Date(referenceYear, referenceMonth, card.closing_day)

  const invoiceMonth =
    referenceDate.getDate() <= card.closing_day
      ? new Date(referenceYear, referenceMonth, 1)
      : new Date(referenceYear, referenceMonth + 1, 1)

  const dueDate = new Date(referenceYear, referenceMonth, card.due_day)
  if (dueDate < closingDate) {
    dueDate.setMonth(dueDate.getMonth() + 1)
  }

  if (dueDate < today) {
    dueDate.setMonth(dueDate.getMonth() + 1)
    if (invoiceMonth.getMonth() === referenceMonth && invoiceMonth.getFullYear() === referenceYear) {
      invoiceMonth.setMonth(invoiceMonth.getMonth() + 1)
    }
  }

  return {
    reference_month: toLocalDateString(invoiceMonth),
    closing_date: toLocalDateString(closingDate),
    due_date: toLocalDateString(dueDate),
  }
}

export type PurchaseDueLike = {
  purchase_date: string
  current_installment: number
  installments: number
  is_recurring?: boolean | null
  installment_amount?: number
}

/** Recorrente ativo entra em todo ciclo após a compra; demais seguem a janela de parcelas. */
export const isPurchaseDueInInvoiceMonth = (
  purchase: PurchaseDueLike,
  targetMonth: number,
  targetYear: number
): boolean => {
  if (purchase.current_installment > purchase.installments) return false

  const purchaseDateObj = new Date(
    purchase.purchase_date.includes('T') ? purchase.purchase_date : `${purchase.purchase_date}T12:00:00`
  )
  const purchaseMonth = purchaseDateObj.getMonth() + 1
  const purchaseYear = purchaseDateObj.getFullYear()
  const monthsDiff = (targetYear - purchaseYear) * 12 + (targetMonth - purchaseMonth)

  if (purchase.is_recurring) {
    return monthsDiff >= 0
  }

  return (
    monthsDiff >= 1 &&
    monthsDiff >= purchase.current_installment &&
    monthsDiff <= purchase.installments
  )
}

export const sumPurchasesDueInInvoiceMonth = (
  purchases: PurchaseDueLike[],
  targetMonth: number,
  targetYear: number
): number =>
  purchases
    .filter(purchase => isPurchaseDueInInvoiceMonth(purchase, targetMonth, targetYear))
    .reduce((sum, purchase) => sum + (purchase.installment_amount || 0), 0)
