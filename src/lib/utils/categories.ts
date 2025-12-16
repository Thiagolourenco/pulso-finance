import { supabase } from '@/lib/supabase/client'

/**
 * Obtém ou cria uma categoria padrão para o usuário
 */
export const getOrCreateDefaultCategory = async (
  userId: string, 
  type: 'income' | 'expense',
  categoryName: string = 'Outros'
): Promise<string> => {
  try {
    // Tenta buscar categoria do usuário
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', categoryName)
      .maybeSingle()

    if (existingCategory?.id) {
      return existingCategory.id
    }

    // Se não existir, cria uma nova categoria
    const { data: newCategory, error } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name: categoryName,
        type: type, // Obrigatório: 'expense' ou 'income'
        icon: type === 'income' ? '💰' : '📝',
        color: type === 'income' ? '#2ECC71' : '#95A5A6',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Erro ao criar categoria:', error)
      throw new Error(`Erro ao criar categoria ${categoryName}: ${error.message}`)
    }

    if (!newCategory?.id) {
      throw new Error(`Não foi possível criar a categoria ${categoryName}`)
    }

    return newCategory.id
  } catch (error: any) {
    console.error('Erro em getOrCreateDefaultCategory:', error)
    throw error
  }
}

/**
 * Obtém ou cria categoria "Saldo Inicial" para saldos iniciais
 */
export const getOrCreateBalanceCategory = async (userId: string): Promise<string> => {
  return getOrCreateDefaultCategory(userId, 'income', 'Saldo Inicial')
}

