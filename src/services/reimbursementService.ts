import { getOrCreateDefaultCategory } from '@/lib/utils/categories'
import { isPendingReimbursement, isCompanyExpense } from '@/lib/utils/expenseOrigin'
import type { CardPurchase, Transaction } from '@/types'
import { cardPurchaseService } from './cardPurchaseService'
import { transactionService } from './transactionService'

const findMatchingCompanyPurchase = (
  transaction: Transaction,
  purchases: CardPurchase[]
): CardPurchase | undefined => {
  if (!transaction.card_id) return undefined
  const amount = Math.abs(Number(transaction.amount) || 0)
  const purchaseDate = transaction.date.slice(0, 10)
  return purchases.find(
    purchase =>
      purchase.card_id === transaction.card_id &&
      purchase.description === transaction.description &&
      (purchase.purchase_date || '').slice(0, 10) === purchaseDate &&
      Math.abs((purchase.total_amount || 0) - amount) < 0.05 &&
      isPendingReimbursement(purchase)
  )
}

export const reimbursementService = {
  async markReimbursed(params: {
    userId: string
    transaction: Transaction
    purchases: CardPurchase[]
  }) {
    const { userId, transaction, purchases } = params
    if (transaction.type !== 'expense' || !isPendingReimbursement(transaction)) {
      throw new Error('Este lançamento não está aguardando reembolso')
    }

    await transactionService.update(transaction.id, {
      reimbursement_status: 'reimbursed',
    })

    const matchingPurchase = findMatchingCompanyPurchase(transaction, purchases)
    if (matchingPurchase) {
      await cardPurchaseService.update(matchingPurchase.id, {
        reimbursement_status: 'reimbursed',
      })
    }

    if (transaction.account_id) {
      const categoryId = await getOrCreateDefaultCategory(userId, 'income')
      await transactionService.create({
        user_id: userId,
        account_id: transaction.account_id,
        card_id: null,
        category_id: categoryId,
        type: 'income',
        amount: Math.abs(Number(transaction.amount) || 0),
        description: `Reembolso: ${transaction.description}`,
        date: new Date().toISOString().split('T')[0],
        origin: 'personal',
        reimbursement_status: null,
      })
    }
  },

  async removeExpense(params: {
    transaction: Transaction
    purchases: CardPurchase[]
  }) {
    const { transaction, purchases } = params
    if (transaction.type !== 'expense' || !isCompanyExpense(transaction)) {
      throw new Error('Só é possível remover um gasto da empresa')
    }

    const matchingPurchase = findMatchingCompanyPurchase(transaction, purchases)
    if (matchingPurchase) {
      await cardPurchaseService.delete(matchingPurchase.id)
    }

    await transactionService.delete(transaction.id)
  },
}
