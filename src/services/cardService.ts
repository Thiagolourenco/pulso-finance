import { supabase } from '@/lib/supabase/client'
import type { Card, Database } from '@/types'

type CardInsert = Database['public']['Tables']['cards']['Insert']
type CardUpdate = Database['public']['Tables']['cards']['Update']

export const cardService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Card[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Card
  },

  async create(card: CardInsert) {
    const { data, error } = await supabase
      .from('cards')
      .insert(card)
      .select()
      .single()

    if (error) throw error
    return data as Card
  },

  async update(id: string, card: CardUpdate) {
    const { data, error } = await supabase
      .from('cards')
      .update({ ...card, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Card
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}

