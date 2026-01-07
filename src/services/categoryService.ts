import { supabase } from '@/lib/supabase/client'
import type { Category, Database } from '@/types'

type CategoryInsert = Database['public']['Tables']['categories']['Insert']
type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export const categoryService = {
  async getAll(userId: string) {
    // Primeiro tenta com select * (mais seguro, funciona mesmo se monthly_limit não existir)
    let { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })

    // Se der erro de "column does not exist", tenta sem monthly_limit
    if (error && error.message?.includes('monthly_limit does not exist')) {
      console.warn('⚠️ Coluna monthly_limit não existe ainda, buscando sem ela...')
      // Tenta buscar sem monthly_limit
      const fallback = await supabase
        .from('categories')
        .select('id, user_id, name, type, icon, color, parent_id, created_at, updated_at')
        .eq('user_id', userId)
        .order('name', { ascending: true })
      
      if (fallback.error) {
        throw fallback.error
      }
      
      // Adiciona monthly_limit como null para todas as categorias
      return (fallback.data || []).map(cat => ({
        ...cat,
        monthly_limit: null
      })) as Category[]
    }

    if (error) throw error
    return data as Category[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Category
  },

  async create(category: CategoryInsert) {
    // Prepara o payload garantindo tipos corretos
    // Campos obrigatórios: user_id, name, type
    const payload: Record<string, any> = {
      user_id: category.user_id,
      name: category.name.trim(),
      type: category.type, // Obrigatório: 'expense' ou 'income'
    }

    // Adiciona campos opcionais apenas se tiverem valor
    if (category.icon && category.icon.trim() !== '') {
      payload.icon = category.icon.trim()
    }
    if (category.color && category.color.trim() !== '') {
      payload.color = category.color.trim()
    }
    if (category.parent_id) {
      payload.parent_id = category.parent_id
    }

    console.log('Criando categoria com payload:', payload)

    const { data, error } = await supabase
      .from('categories')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar categoria:', error)
      console.error('Código do erro:', error.code)
      console.error('Detalhes:', error.details)
      console.error('Hint:', error.hint)
      console.error('Payload enviado:', payload)
      
      // Mensagem de erro mais amigável
      let errorMessage = error.message || 'Erro ao criar categoria'
      
      if (error.code === '23505') {
        errorMessage = 'Já existe uma categoria com este nome'
      } else if (error.code === '23502') {
        errorMessage = 'Campo obrigatório faltando'
      } else if (error.details) {
        errorMessage = `${errorMessage}: ${error.details}`
      }
      
      throw new Error(errorMessage)
    }
    
    if (!data) {
      throw new Error('Categoria criada mas nenhum dado retornado')
    }
    
    return data as Category
  },

  async update(id: string, category: CategoryUpdate) {
    // Prepara o payload
    const payload: Record<string, any> = {
      ...category,
      updated_at: new Date().toISOString(),
    }

    // Se monthly_limit estiver no payload mas a coluna não existir, remove do payload
    const hasMonthlyLimit = 'monthly_limit' in category && category.monthly_limit !== undefined

    // Tenta atualizar normalmente
    let { data, error } = await supabase
      .from('categories')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    // Se der erro de "column does not exist", remove monthly_limit do payload e tenta novamente
    if (error && error.message?.includes('monthly_limit does not exist')) {
      console.warn('⚠️ Coluna monthly_limit não existe ainda, atualizando sem ela...')
      
      // Remove monthly_limit do payload
      const { monthly_limit, ...payloadWithoutLimit } = payload
      
      const fallback = await supabase
        .from('categories')
        .update(payloadWithoutLimit)
        .eq('id', id)
        .select()
        .single()

      if (fallback.error) {
        throw fallback.error
      }

      // Retorna com monthly_limit como null (já que a coluna não existe)
      return {
        ...fallback.data,
        monthly_limit: null
      } as Category
    }

    // Se der erro de schema cache, usa workaround
    if (error && error.message?.includes('schema cache')) {
      console.warn('⚠️ Erro de schema cache detectado, usando workaround...')
      
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('categories')
        .update(payload as any)
        .eq('id', id)
        .select()
        .single()

      if (fallbackError && !fallbackError.message?.includes('schema cache')) {
        throw fallbackError
      }

      if (fallbackData) {
        return fallbackData as Category
      }

      // Busca novamente
      const { data: fetchedData, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        throw new Error('Não foi possível atualizar a categoria')
      }

      return fetchedData as Category
    }

    if (error) throw error
    return data as Category
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}

