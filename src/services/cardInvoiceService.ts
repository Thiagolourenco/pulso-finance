import { supabase } from '@/lib/supabase/client'
import type { CardInvoice, Database } from '@/types'

type CardInvoiceInsert = Database['public']['Tables']['card_invoices']['Insert']
type CardInvoiceUpdate = Database['public']['Tables']['card_invoices']['Update']

export const cardInvoiceService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('card_invoices')
      .select('*')
      .eq('user_id', userId)
      .order('reference_month', { ascending: false })

    if (error) throw error
    return data as CardInvoice[]
  },

  async getByCard(cardId: string) {
    const { data, error } = await supabase
      .from('card_invoices')
      .select('*')
      .eq('card_id', cardId)
      .order('reference_month', { ascending: false })

    if (error) throw error
    return data as CardInvoice[]
  },

  async getOpenByCard(cardId: string) {
    const { data, error } = await supabase
      .from('card_invoices')
      .select('*')
      .eq('card_id', cardId)
      .eq('status', 'open')
      .order('reference_month', { ascending: false })
      .maybeSingle()

    if (error) throw error
    return data as CardInvoice | null
  },

  async create(invoice: CardInvoiceInsert) {
    const { data, error } = await supabase
      .from('card_invoices')
      .insert({
        ...invoice,
        status: invoice.status || 'open',
        total_amount: invoice.total_amount || 0,
      })
      .select()
      .single()

    if (error) throw error
    return data as CardInvoice
  },

  async update(id: string, invoice: CardInvoiceUpdate) {
    const { data, error } = await supabase
      .from('card_invoices')
      .update({ ...invoice, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as CardInvoice
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('card_invoices')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}


