import { supabase } from '@/lib/supabase/client'

type CategoryPreferences = {
  user_id: string
  selected_category_ids: string[]
  show_only_critical: boolean
  updated_at?: string
}

export const categoryPreferencesService = {
  async get(userId: string): Promise<CategoryPreferences | null> {
    const { data, error } = await supabase
      .from('category_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Erro ao buscar preferências de categorias:', error)
      return null
    }

    return data as CategoryPreferences | null
  },

  async upsert(userId: string, prefs: { selected_category_ids: string[]; show_only_critical: boolean }) {
    const payload: CategoryPreferences = {
      user_id: userId,
      selected_category_ids: prefs.selected_category_ids,
      show_only_critical: prefs.show_only_critical,
    }

    const { error } = await supabase
      .from('category_preferences')
      .upsert(payload, { onConflict: 'user_id' })

    if (error) {
      console.error('Erro ao salvar preferências de categorias:', error)
      throw error
    }
  },
}


