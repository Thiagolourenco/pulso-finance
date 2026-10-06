import { supabase } from '@/lib/supabase/client'
import type { Card, CardPurchase, Database } from '@/types'
import { cardInvoiceService } from './cardInvoiceService'

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








