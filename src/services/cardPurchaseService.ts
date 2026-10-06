import { supabase } from '@/lib/supabase/client'
import {
  canUseOriginColumns,
  isMissingOriginColumnError,
  markOriginColumnsUnavailable,
  omitOriginFields,
  withOriginFieldsIfSupported,
} from '@/lib/supabase/schemaCache'
import type { Card, CardPurchase, Database } from '@/types'
import { cardInvoiceService } from './cardInvoiceService'

type CardPurchaseInsert = Database['public']['Tables']['card_purchases']['Insert']
type CardPurchaseUpdate = Database['public']['Tables']['card_purchases']['Update']

const CARD_PURCHASE_SAFE_SELECT =
  'id, user_id, card_id, description, total_amount, installments, installment_amount, current_installment, purchase_date, category_id, is_recurring, is_paid_current_month, created_at, updated_at'

export const cardPurchaseService = {
  async getAll(userId: string) {
    const primary = await supabase
      .from('card_purchases')
      .select('*')
      .eq('user_id', userId)
      .order('purchase_date', { ascending: false })

    if (!primary.error) return primary.data as CardPurchase[]

    if (isMissingOriginColumnError(primary.error)) {
      markOriginColumnsUnavailable()
      const fallback = await supabase
        .from('card_purchases')
        .select(CARD_PURCHASE_SAFE_SELECT)
        .eq('user_id', userId)
        .order('purchase_date', { ascending: false })
      if (fallback.error) throw fallback.error
      return fallback.data as CardPurchase[]
    }

    throw primary.error
  },

  async getByCard(cardId: string) {
    const primary = await supabase
      .from('card_purchases')
      .select('*')
      .eq('card_id', cardId)
      .order('purchase_date', { ascending: false })

    if (!primary.error) return primary.data as CardPurchase[]

    if (isMissingOriginColumnError(primary.error)) {
      markOriginColumnsUnavailable()
      const fallback = await supabase
        .from('card_purchases')
        .select(CARD_PURCHASE_SAFE_SELECT)
        .eq('card_id', cardId)
        .order('purchase_date', { ascending: false })
      if (fallback.error) throw fallback.error
      return fallback.data as CardPurchase[]
    }

    throw primary.error
  },

  async create(purchase: CardPurchaseInsert) {
    const payload = withOriginFieldsIfSupported({
      ...purchase,
      current_installment: purchase.current_installment || 1,
    } as Record<string, unknown>) as CardPurchaseInsert

    let { data, error } = await supabase.from('card_purchases').insert(payload).select().single()

    if (error && isMissingOriginColumnError(error) && canUseOriginColumns()) {
      markOriginColumnsUnavailable()
      const retry = await supabase
        .from('card_purchases')
        .insert(
          omitOriginFields({
            ...purchase,
            current_installment: purchase.current_installment || 1,
          } as Record<string, unknown>) as CardPurchaseInsert
        )
        .select()
        .single()
      data = retry.data
      error = retry.error
    }

    if (error) throw error
    return data as CardPurchase
  },

  /** Cria a compra no cartão e soma a parcela na fatura do ciclo. */
  async createFromExpense(params: {
    userId: string
    card: Pick<Card, 'id' | 'closing_day' | 'due_day'>
    description: string
    totalAmount: number
    installments: number
    purchaseDate: string
    categoryId?: string | null
    isRecurring?: boolean
    origin?: 'personal' | 'company'
    reimbursement_status?: 'pending' | 'reimbursed' | null
  }) {
    const installments = Math.max(1, Math.floor(params.installments) || 1)
    const installmentAmount = params.totalAmount / installments

    await cardInvoiceService.addAmountForPurchase({
      userId: params.userId,
      card: params.card,
      purchaseDate: params.purchaseDate,
      amount: installmentAmount,
    })

    return this.create({
      user_id: params.userId,
      card_id: params.card.id,
      description: params.description,
      total_amount: params.totalAmount,
      installments,
      installment_amount: installmentAmount,
      current_installment: 1,
      purchase_date: params.purchaseDate,
      category_id: params.categoryId || null,
      is_recurring: params.isRecurring ?? false,
      origin: params.origin ?? 'personal',
      reimbursement_status: params.reimbursement_status ?? null,
    })
  },

  async update(id: string, purchase: CardPurchaseUpdate) {
    const payload = withOriginFieldsIfSupported({
      ...purchase,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>) as CardPurchaseUpdate

    let { data, error } = await supabase
      .from('card_purchases')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error && isMissingOriginColumnError(error) && canUseOriginColumns()) {
      markOriginColumnsUnavailable()
      const retry = await supabase
        .from('card_purchases')
        .update(
          omitOriginFields({
            ...purchase,
            updated_at: new Date().toISOString(),
          } as Record<string, unknown>) as CardPurchaseUpdate
        )
        .eq('id', id)
        .select()
        .single()
      data = retry.data
      error = retry.error
    }

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








