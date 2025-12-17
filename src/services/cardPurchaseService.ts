import { supabase } from '@/lib/supabase/client'
import type { CardPurchase, Database } from '@/types'

type CardPurchaseInsert = Database['public']['Tables']['card_purchases']['Insert']
type CardPurchaseUpdate = Database['public']['Tables']['card_purchases']['Update']

export const cardPurchaseService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('card_purchases')
      .select('*')
      .eq('user_id', userId)
      .order('purchase_date', { ascending: false })

    if (error) throw error
    return data as CardPurchase[]
  },

  async getByCard(cardId: string) {
    const { data, error } = await supabase
      .from('card_purchases')
      .select('*')
      .eq('card_id', cardId)
      .order('purchase_date', { ascending: false })

    if (error) throw error
    return data as CardPurchase[]
  },

  async create(purchase: CardPurchaseInsert) {
    const { data, error } = await supabase
      .from('card_purchases')
      .insert({
        ...purchase,
        current_installment: purchase.current_installment || 1,
      })
      .select()
      .single()

    if (error) throw error
    return data as CardPurchase
  },

  async update(id: string, purchase: CardPurchaseUpdate) {
    const { data, error } = await supabase
      .from('card_purchases')
      .update({ ...purchase, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as CardPurchase
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('card_purchases')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}







