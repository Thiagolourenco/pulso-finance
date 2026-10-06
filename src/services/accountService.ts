import { supabase } from '@/lib/supabase/client'
import {
  computeAccountBalanceFromLedger,
  computeTransactionDeltaForAccount,
  isInitialBalanceEntry,
} from '@/lib/utils/accountBalance'
import type { Account, Database, Transaction } from '@/types'

type AccountInsert = Database['public']['Tables']['accounts']['Insert']
type AccountUpdate = Database['public']['Tables']['accounts']['Update']

export const accountService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Account[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Account
  },

  async create(account: AccountInsert) {
    const { data, error } = await supabase
      .from('accounts')
      .insert(account)
      .select()
      .single()

    if (error) throw error
    return data as Account
  },

  async update(id: string, account: AccountUpdate) {
    const { data, error } = await supabase
      .from('accounts')
      .update({ ...account, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Account
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  /** Corrige saldos armazenados com base no razão: saldo inicial + transações vinculadas. */
  async syncBalancesFromTransactions(
    accounts: Account[],
    transactions: Transaction[]
  ): Promise<number> {
    let updated = 0

    for (const account of accounts) {
      const expected = computeAccountBalanceFromLedger(account, transactions)
      const stored = Number(account.current_balance) || 0
      if (Math.abs(expected - stored) < 0.01) continue

      await this.update(account.id, { current_balance: expected })
      updated += 1
    }

    return updated
  },

  /**
   * Reverte inflação causada pelo auto-vínculo de receitas sem conta.
   * Desvincula receitas que provavelmente eram só para relatório e recalcula o saldo.
   */
  async repairAutoLinkDamage(
    accounts: Account[],
    transactions: Transaction[]
  ): Promise<{ unlinkedCount: number; accountsFixed: number }> {
    let unlinkedCount = 0
    let accountsFixed = 0

    for (const account of accounts) {
      const linkedIncomes = transactions.filter(
        (t) =>
          t.account_id === account.id &&
          t.type === 'income' &&
          !isInitialBalanceEntry(t.description)
      )
      if (linkedIncomes.length < 2) continue

      const incomeSum = linkedIncomes.reduce(
        (sum, t) => sum + Math.abs(Number(t.amount) || 0),
        0
      )
      const initial = Number(account.initial_balance) || 0

      // Várias receitas vinculadas somando bem mais que o saldo inicial indica inflação.
      if (incomeSum <= initial * 1.5) continue

      const ids = linkedIncomes.map((t) => t.id)
      const { error: txError } = await supabase
        .from('transactions')
        .update({ account_id: null })
        .in('id', ids)
      if (txError) throw txError

      unlinkedCount += ids.length

      const expenseDelta = computeTransactionDeltaForAccount(
        account.id,
        transactions.filter((t) => t.type === 'expense')
      )
      await this.update(account.id, { current_balance: initial + expenseDelta })
      accountsFixed += 1
    }

    return { unlinkedCount, accountsFixed }
  },

  async setCurrentBalances(
    updates: { id: string; current_balance: number; initial_balance: number }[]
  ) {
    for (const update of updates) {
      await this.update(update.id, {
        current_balance: update.current_balance,
        initial_balance: update.initial_balance,
      })
    }
  },
}

