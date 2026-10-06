import { supabase } from '@/lib/supabase/client'
import {
  canUseOriginColumns,
  isMissingOriginColumnError,
  markOriginColumnsUnavailable,
  omitOriginFields,
  withOriginFieldsIfSupported,
} from '@/lib/supabase/schemaCache'
import { balanceDeltaForTransaction } from '@/lib/utils/accountBalance'
import type { Transaction, Database } from '@/types'
import { accountService } from './accountService'

type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

const TRANSACTION_SAFE_SELECT =
  'id, user_id, account_id, card_id, category_id, amount, description, type, date, created_at, updated_at'

async function applyBalanceDelta(accountId: string, delta: number) {
  const account = await accountService.getById(accountId)
  const current = Number(account.current_balance) || 0
  await accountService.update(accountId, { current_balance: current + delta })
}

async function selectTransactions(userId: string) {
  const primary = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (!primary.error) return primary.data as Transaction[]

  if (isMissingOriginColumnError(primary.error)) {
    markOriginColumnsUnavailable()
    const fallback = await supabase
      .from('transactions')
      .select(TRANSACTION_SAFE_SELECT)
      .eq('user_id', userId)
      .order('date', { ascending: false })
    if (fallback.error) throw fallback.error
    return fallback.data as Transaction[]
  }

  throw primary.error
}

export const transactionService = {
  async getAll(userId: string) {
    return selectTransactions(userId)
  },

  async getById(id: string) {
    const primary = await supabase.from('transactions').select('*').eq('id', id).single()
    if (!primary.error) return primary.data as Transaction

    if (isMissingOriginColumnError(primary.error)) {
      markOriginColumnsUnavailable()
      const fallback = await supabase
        .from('transactions')
        .select(TRANSACTION_SAFE_SELECT)
        .eq('id', id)
        .single()
      if (fallback.error) throw fallback.error
      return fallback.data as Transaction
    }

    throw primary.error
  },

  async create(transaction: TransactionInsert) {
    const payload = withOriginFieldsIfSupported(
      transaction as Record<string, unknown>
    ) as TransactionInsert

    let { data, error } = await supabase
      .from('transactions')
      .insert(payload)
      .select()
      .single()

    if (error && isMissingOriginColumnError(error) && canUseOriginColumns()) {
      markOriginColumnsUnavailable()
      const retry = await supabase
        .from('transactions')
        .insert(omitOriginFields(transaction as Record<string, unknown>) as TransactionInsert)
        .select()
        .single()
      data = retry.data
      error = retry.error
    }

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

    const payload = withOriginFieldsIfSupported({
      ...transaction,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>) as TransactionUpdate

    let { data, error } = await supabase
      .from('transactions')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error && isMissingOriginColumnError(error) && canUseOriginColumns()) {
      markOriginColumnsUnavailable()
      const retry = await supabase
        .from('transactions')
        .update(
          omitOriginFields({
            ...transaction,
            updated_at: new Date().toISOString(),
          } as Record<string, unknown>) as TransactionUpdate
        )
        .eq('id', id)
        .select()
        .single()
      data = retry.data
      error = retry.error
    }

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

