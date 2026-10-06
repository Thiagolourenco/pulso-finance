import { supabase } from '@/lib/supabase/client'
import { getInvoiceCycleDates, type CardBillingDays } from '@/lib/utils/cardInvoiceCycle'
import type { CardInvoice, Database } from '@/types'

type CardInvoiceInsert = Database['public']['Tables']['card_invoices']['Insert']
type CardInvoiceUpdate = Database['public']['Tables']['card_invoices']['Update']

const isDuplicateInvoiceError = (error: { code?: string; message?: string } | null) =>
  error?.code === '23505' || Boolean(error?.message?.includes('card_invoices_card_id_reference_month_key'))

const toError = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error
  if (typeof error === 'object' && error && 'message' in error) {
    const message = String((error as { message: unknown }).message || fallback)
    return new Error(message)
  }
  return new Error(fallback)
}

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
      .order('due_date', { ascending: false })
      .limit(1)

    if (error) throw toError(error, 'Erro ao buscar fatura aberta')
    return (data?.[0] as CardInvoice | undefined) ?? null
  },

  async getByCardAndReferenceMonth(cardId: string, referenceMonth: string) {
    const { data, error } = await supabase
      .from('card_invoices')
      .select('*')
      .eq('card_id', cardId)
      .eq('reference_month', referenceMonth)
      .maybeSingle()

    if (error) throw toError(error, 'Erro ao buscar fatura')
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

    if (error) throw toError(error, 'Erro ao criar fatura')
    return data as CardInvoice
  },

  async update(id: string, invoice: CardInvoiceUpdate) {
    const { data, error } = await supabase
      .from('card_invoices')
      .update({ ...invoice, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw toError(error, 'Erro ao atualizar fatura')
    return data as CardInvoice
  },

  /** Define o valor da fatura aberta (ou cria a do ciclo atual) para bater com o app do banco. */
  async setManualAmount(params: {
    userId: string
    card: CardBillingDays & { id: string }
    amount: number
  }): Promise<CardInvoice> {
    const amount = Math.round((Number(params.amount) || 0) * 100) / 100
    const dates = getInvoiceCycleDates(params.card)
    const payload: CardInvoiceUpdate = {
      total_amount: amount,
      status: 'open',
    }

    const existing = await this.getByCardAndReferenceMonth(params.card.id, dates.reference_month)
    if (existing) {
      return this.update(existing.id, payload)
    }

    const open = await this.getOpenByCard(params.card.id)
    if (open) {
      return this.update(open.id, payload)
    }

    try {
      return await this.create({
        user_id: params.userId,
        card_id: params.card.id,
        reference_month: dates.reference_month,
        closing_date: dates.closing_date,
        due_date: dates.due_date,
        status: 'open',
        total_amount: amount,
      })
    } catch (error) {
      if (isDuplicateInvoiceError(error as { code?: string; message?: string })) {
        const retryExisting = await this.getByCardAndReferenceMonth(params.card.id, dates.reference_month)
        if (retryExisting) {
          return this.update(retryExisting.id, payload)
        }
      }
      throw toError(error, 'Erro ao atualizar valor da fatura')
    }
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('card_invoices')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}








