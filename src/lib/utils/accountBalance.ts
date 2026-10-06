import type { Account, Transaction } from '@/types'

export function isInitialBalanceEntry(description?: string | null): boolean {
  return (description || '').toLowerCase().startsWith('saldo inicial:')
}

/** Despesa lançada no cartão: entra na fatura, não no saldo da conta. */
export function isCardExpense(t: Pick<Transaction, 'type' | 'card_id'>): boolean {
  return t.type === 'expense' && Boolean(t.card_id)
}

/** Variação no saldo da conta causada por esta transação (receita +, despesa -). */
export function balanceDeltaForTransaction(
  t: Pick<Transaction, 'type' | 'amount'>
): number {
  if (t.type === 'income') return Math.abs(Number(t.amount) || 0)
  if (t.type === 'expense') return -Math.abs(Number(t.amount) || 0)
  return 0
}

export function computeTransactionDeltaForAccount(
  accountId: string,
  transactions: Pick<Transaction, 'account_id' | 'type' | 'amount' | 'description'>[]
): number {
  return transactions
    .filter(
      (t) =>
        t.account_id === accountId &&
        (t.type === 'income' || t.type === 'expense') &&
        !isInitialBalanceEntry(t.description)
    )
    .reduce((sum, t) => sum + balanceDeltaForTransaction(t), 0)
}

/** Saldo esperado = saldo inicial + movimentações vinculadas à conta. */
export function computeAccountBalanceFromLedger(
  account: Pick<Account, 'id' | 'initial_balance'>,
  transactions: Pick<Transaction, 'account_id' | 'type' | 'amount' | 'description'>[]
): number {
  const delta = computeTransactionDeltaForAccount(account.id, transactions)
  return (Number(account.initial_balance) || 0) + delta
}

export function computeTotalWealth(
  accounts: Pick<Account, 'current_balance'>[]
): number {
  return accounts.reduce((sum, account) => sum + (Number(account.current_balance) || 0), 0)
}

/** Ajusta o saldo inicial para o saldo atual informado continuar batendo com o razão. */
export function payloadForManualCurrentBalance(
  accountId: string,
  transactions: Pick<Transaction, 'account_id' | 'type' | 'amount' | 'description'>[],
  newCurrentBalance: number
): { current_balance: number; initial_balance: number } {
  const txDelta = computeTransactionDeltaForAccount(accountId, transactions)
  return {
    current_balance: newCurrentBalance,
    initial_balance: newCurrentBalance - txDelta,
  }
}
