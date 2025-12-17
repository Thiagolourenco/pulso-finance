import { supabase } from '@/lib/supabase/client'
import type { RecurringExpense, Database } from '@/types'

type RecurringExpenseInsert = Database['public']['Tables']['recurring_expenses']['Insert']
type RecurringExpenseUpdate = Database['public']['Tables']['recurring_expenses']['Update']

export const recurringExpenseService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', userId)
      .order('due_day', { ascending: true })

    if (error) throw error
    return data as RecurringExpense[]
  },

  async getActive(userId: string) {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('due_day', { ascending: true })

    if (error) throw error
    return data as RecurringExpense[]
  },

  async create(expense: RecurringExpenseInsert) {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .insert(expense)
      .select()
      .single()

    if (error) throw error
    return data as RecurringExpense
  },

  async update(id: string, expense: RecurringExpenseUpdate) {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .update({ ...expense, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as RecurringExpense
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('recurring_expenses')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}







