import { supabase } from '@/lib/supabase/client'
import { getInvoiceCycleDates, type CardBillingDays } from '@/lib/utils/cardInvoiceCycle'
import type { CardInvoice, Database } from '@/types'

type CardInvoiceInsert = Database['public']['Tables']['card_invoices']['Insert']
type CardInvoiceUpdate = Database['public']['Tables']['card_invoices']['Update']

const isDuplicateInvoiceError = (error: { code?: string; message?: string } | null) =>
  error?.code === '23505' || error?.message?.includes('card_invoices_card_id_reference_month_key')

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

  async getByCardAndReferenceMonth(cardId: string, referenceMonth: string) {
    const { data, error } = await supabase
      .from('card_invoices')
      .select('*')
      .eq('card_id', cardId)
      .eq('reference_month', referenceMonth)
      .maybeSingle()

    if (error) throw error
    return data as CardInvoice | null
  },

  /** Busca fatura do ciclo ou cria/atualiza, evitando violação de unique (card_id, reference_month). */
  async addAmountForPurchase(params: {
    userId: string
    card: CardBillingDays & { id: string }
    purchaseDate: string
    amount: number
  }): Promise<CardInvoice> {
    const dates = getInvoiceCycleDates(params.card, params.purchaseDate)
    const existing = await this.getByCardAndReferenceMonth(params.card.id, dates.reference_month)

    if (existing) {
      const updateData: CardInvoiceUpdate = {
        total_amount: (existing.total_amount || 0) + params.amount,
      }

      if (existing.status !== 'open') {
        updateData.status = 'open'
        updateData.last_paid_reference_month = null
      }

      return this.update(existing.id, updateData)
    }

    const { data, error } = await supabase
      .from('card_invoices')
      .insert({
        user_id: params.userId,
        card_id: params.card.id,
        reference_month: dates.reference_month,
        closing_date: dates.closing_date,
        due_date: dates.due_date,
        status: 'open',
        total_amount: params.amount,
      })
      .select()
      .single()

    if (!error && data) {
      return data as CardInvoice
    }

    if (isDuplicateInvoiceError(error)) {
      const retryExisting = await this.getByCardAndReferenceMonth(params.card.id, dates.reference_month)
      if (retryExisting) {
        return this.update(retryExisting.id, {
          total_amount: (retryExisting.total_amount || 0) + params.amount,
          status: 'open',
          last_paid_reference_month: null,
        })
      }
    }

    throw error ?? new Error('Erro ao criar fatura')
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








