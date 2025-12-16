import { supabase } from '@/lib/supabase/client'
import type { Category, Database } from '@/types'

type CategoryInsert = Database['public']['Tables']['categories']['Insert']
type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export const categoryService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })

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
    const { data, error } = await supabase
      .from('categories')
      .update({ ...category, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

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

