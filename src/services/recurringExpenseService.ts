import { supabase } from '@/lib/supabase/client'
import type { RecurringExpense, Database } from '@/types'

type RecurringExpenseInsert = Database['public']['Tables']['recurring_expenses']['Insert']
type RecurringExpenseUpdate = Database['public']['Tables']['recurring_expenses']['Update']

export const recurringExpenseService = {
  async getAll(userId: string) {
    // Tenta buscar com is_paid_current_month primeiro
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('id, user_id, name, amount, due_day, category_id, account_id, is_active, description, created_at, updated_at, is_paid_current_month, transaction_id')
      .eq('user_id', userId)
      .order('due_day', { ascending: true })

    if (error) {
      // Se o erro for sobre a coluna is_paid_current_month não existir, tenta novamente sem ela
      if (error.message?.includes('is_paid_current_month') || error.message?.includes('schema cache')) {
        console.warn('Coluna is_paid_current_month não encontrada, usando fallback. Execute o script SQL para criar a coluna.')
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('recurring_expenses')
          .select('id, user_id, name, amount, due_day, category_id, account_id, is_active, description, created_at, updated_at')
          .eq('user_id', userId)
          .order('due_day', { ascending: true })
        
        if (fallbackError) throw fallbackError
        
        // Adiciona is_paid_current_month como false para todos os registros
        return (fallbackData || []).map(item => ({ ...item, is_paid_current_month: false })) as RecurringExpense[]
      }
      throw error
    }
    
    // Garante que is_paid_current_month existe em todos os registros (pode ser null se a coluna não existir)
    return (data || []).map(item => ({
      ...item,
      is_paid_current_month: item.is_paid_current_month ?? false
    })) as RecurringExpense[]
  },

  async getActive(userId: string) {
    // Tenta buscar com is_paid_current_month primeiro
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('id, user_id, name, amount, due_day, category_id, account_id, is_active, description, created_at, updated_at, is_paid_current_month, transaction_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('due_day', { ascending: true })

    if (error) {
      // Se o erro for sobre a coluna is_paid_current_month não existir, tenta novamente sem ela
      if (error.message?.includes('is_paid_current_month') || error.message?.includes('schema cache')) {
        console.warn('Coluna is_paid_current_month não encontrada, usando fallback. Execute o script SQL para criar a coluna.')
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('recurring_expenses')
          .select('id, user_id, name, amount, due_day, category_id, account_id, is_active, description, created_at, updated_at')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('due_day', { ascending: true })
        
        if (fallbackError) throw fallbackError
        
        // Adiciona is_paid_current_month como false para todos os registros
        return (fallbackData || []).map(item => ({ ...item, is_paid_current_month: false })) as RecurringExpense[]
      }
      throw error
    }
    
    // Garante que is_paid_current_month existe em todos os registros (pode ser null se a coluna não existir)
    return (data || []).map(item => ({
      ...item,
      is_paid_current_month: item.is_paid_current_month ?? false
    })) as RecurringExpense[]
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
    // Busca a despesa atual para verificar mudanças
    // Tenta primeiro com todas as colunas, depois sem as colunas opcionais se falhar
    let currentExpense: any
    
    const { data: dataWithColumns, error: errorWithColumns } = await supabase
      .from('recurring_expenses')
      .select('id, user_id, name, amount, due_day, category_id, account_id, is_active, is_paid_current_month, transaction_id')
      .eq('id', id)
      .single()

    if (errorWithColumns && (errorWithColumns.message?.includes('is_paid_current_month') || errorWithColumns.message?.includes('transaction_id') || errorWithColumns.message?.includes('schema cache'))) {
      // Se falhar por causa das colunas, tenta sem elas
      const { data: dataWithoutColumns, error: errorWithoutColumns } = await supabase
        .from('recurring_expenses')
        .select('id, user_id, name, amount, due_day, category_id, account_id, is_active')
        .eq('id', id)
        .single()
      
      if (errorWithoutColumns) throw errorWithoutColumns
      currentExpense = { ...dataWithoutColumns, is_paid_current_month: false, transaction_id: null }
    } else {
      if (errorWithColumns) throw errorWithColumns
      currentExpense = dataWithColumns
    }

    // Limpa transaction_id se existir (transações antigas que possam ter sido criadas)
    if (currentExpense.transaction_id && expense.transaction_id === undefined) {
      // Remove transaction_id do update para limpar referências antigas
      expense.transaction_id = null
    }

    // O checkbox "paga" é apenas um booleano para validar se foi paga no mês correspondente
    // NÃO cria transações para evitar duplicação, pois as despesas recorrentes
    // já são incluídas no cálculo de despesas do mês
    const updateData = { ...expense, updated_at: new Date().toISOString() }
    
    const { data, error } = await supabase
      .from('recurring_expenses')
      .update(updateData)
      .eq('id', id)
      .select('id, user_id, name, amount, due_day, category_id, account_id, is_active, description, created_at, updated_at, is_paid_current_month, transaction_id')
      .single()

    if (error) {
      // Se o erro for sobre a coluna is_paid_current_month não existir, tenta atualizar sem ela
      if (error.message?.includes('is_paid_current_month')) {
        // Remove is_paid_current_month do update se a coluna não existir
        const { is_paid_current_month, ...updateWithoutColumn } = updateData
        
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('recurring_expenses')
          .update(updateWithoutColumn)
          .eq('id', id)
          .select('id, user_id, name, amount, due_day, category_id, account_id, is_active, description, created_at, updated_at')
          .single()
        
        if (fallbackError) throw fallbackError
        
        // Adiciona is_paid_current_month como false se estava sendo atualizado
        return { ...fallbackData, is_paid_current_month: false } as RecurringExpense
      }
      throw error
    }
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








