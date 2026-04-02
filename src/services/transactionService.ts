import { supabase } from '@/lib/supabase/client'
import type { Transaction, Database } from '@/types'
import { accountService } from './accountService'

type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

/** Variação no saldo da conta causada por esta transação (receita +, despesa -). */
function balanceDeltaForTransaction(t: Pick<Transaction, 'type' | 'amount'>): number {
  if (t.type === 'income') return Math.abs(Number(t.amount) || 0)
  if (t.type === 'expense') return -Math.abs(Number(t.amount) || 0)
  return 0
}

async function applyBalanceDelta(accountId: string, delta: number) {
  const account = await accountService.getById(accountId)
  const current = Number(account.current_balance) || 0
  await accountService.update(accountId, { current_balance: current + delta })
}

export const transactionService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) throw error
    return data as Transaction[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Transaction
  },

  async create(transaction: TransactionInsert) {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single()

    if (error) throw error
    const created = data as Transaction
    if (created.account_id && (created.type === 'income' || created.type === 'expense')) {
      await applyBalanceDelta(created.account_id, balanceDeltaForTransaction(created))
    }
    return created
  },

  async update(id: string, transaction: TransactionUpdate) {
    const old = await this.getById(id)
    const hadLinkedBalance =
      old.account_id && (old.type === 'income' || old.type === 'expense')

    if (hadLinkedBalance) {
      await applyBalanceDelta(old.account_id!, -balanceDeltaForTransaction(old))
    }

    const { data, error } = await supabase
      .from('transactions')
      .update({ ...transaction, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (hadLinkedBalance) {
        await applyBalanceDelta(old.account_id!, balanceDeltaForTransaction(old))
      }
      throw error
    }

    const updated = data as Transaction
    if (updated.account_id && (updated.type === 'income' || updated.type === 'expense')) {
      await applyBalanceDelta(updated.account_id, balanceDeltaForTransaction(updated))
    }
    return updated
  },

  async delete(id: string) {
    const old = await this.getById(id)
    const hadLinkedBalance =
      old.account_id && (old.type === 'income' || old.type === 'expense')

    if (hadLinkedBalance) {
      await applyBalanceDelta(old.account_id!, -balanceDeltaForTransaction(old))
    }

    const { error } = await supabase.from('transactions').delete().eq('id', id)

    if (error) {
      if (hadLinkedBalance) {
        await applyBalanceDelta(old.account_id!, balanceDeltaForTransaction(old))
      }
      throw error
    }
  },

  async getByMonth(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })

    if (error) throw error
    return data as Transaction[]
  },
}

