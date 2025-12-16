import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types'

type GoalInsert = Database['public']['Tables']['goals']['Insert']
type GoalUpdate = Database['public']['Tables']['goals']['Update']

export type Goal = Database['public']['Tables']['goals']['Row']

export const goalService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('target_date', { ascending: true, nullsFirst: false })

    if (error) throw error
    return data as Goal[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Goal
  },

  async create(goal: GoalInsert) {
    const { data, error } = await supabase
      .from('goals')
      .insert(goal)
      .select()
      .single()

    if (error) throw error
    return data as Goal
  },

  async update(id: string, goal: GoalUpdate) {
    const { data, error } = await supabase
      .from('goals')
      .update({ ...goal, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Goal
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async addAmount(id: string, amount: number) {
    const goal = await this.getById(id)
    const newAmount = (goal.current_amount || 0) + amount
    
    return this.update(id, { current_amount: newAmount })
  },
}
