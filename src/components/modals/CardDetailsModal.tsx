import { useState } from 'react'
import { Modal, Button, CurrencyInput, Input, Toast } from '@/components/ui'
import { useCardPurchases } from '@/hooks/useCardPurchases'
import { useCardInvoices } from '@/hooks/useCardInvoices'
import { useQueryClient } from '@tanstack/react-query'
import { PurchaseItem } from '@/components/PurchaseItem'
import type { Card, CardPurchase } from '@/types'
import { supabase } from '@/lib/supabase/client'

interface CardDetailsModalProps {
  card: Card
  isOpen: boolean
  onClose: () => void
  onPurchaseAdded: () => void
}

export const CardDetailsModal = ({
  card,
  isOpen,
  onClose,
  onPurchaseAdded,
}: CardDetailsModalProps) => {
  const [showAddPurchase, setShowAddPurchase] = useState(false)
  const [description, setDescription] = useState('')
  const [totalAmount, setTotalAmount] = useState(0)
  const [installments, setInstallments] = useState(1)
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [isRecurring, setIsRecurring] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const queryClient = useQueryClient()
  const { purchases, updatePurchase } = useCardPurchases(card.id)
  const { openInvoice } = useCardInvoices(card.id)

  const activePurchases = purchases.filter(p => p.current_installment < p.installments)
  // Filtra compras recorrentes (trata null/undefined como false)
  const recurringPurchases = activePurchases.filter(p => p.is_recurring === true)
  const nonRecurringPurchases = activePurchases.filter(p => !p.is_recurring)

  // Debug: log para verificar as compras recorrentes
  console.log('🔍 Debug Compras:', {
    total: purchases.length,
    active: activePurchases.length,
    recurring: recurringPurchases.length,
    recurringPurchases: recurringPurchases.map(p => ({ id: p.id, description: p.description, is_recurring: p.is_recurring })),
    allPurchases: purchases.map(p => ({ id: p.id, description: p.description, is_recurring: p.is_recurring }))
  })

  // Calcula total da fatura (soma das parcelas que vencem nesta fatura)
  const invoiceTotal = openInvoice ? (openInvoice.total_amount || 0) : 0

  const handleAddPurchase = async () => {
    if (!description.trim()) {
      setToast({ message: 'Descrição é obrigatória', type: 'error' })
      return
    }

    if (totalAmount <= 0) {
      setToast({ message: 'Valor deve ser maior que zero', type: 'error' })
      return
    }

    if (installments < 1) {
      setToast({ message: 'Número de parcelas deve ser pelo menos 1', type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setToast({ message: 'Você precisa estar logado', type: 'error' })
        return
      }

      const installmentAmount = totalAmount / installments

      // Busca ou cria fatura aberta
      let invoiceId: string
      if (openInvoice) {
        invoiceId = openInvoice.id
        await supabase
          .from('card_invoices')
          .update({ 
            total_amount: (openInvoice.total_amount || 0) + installmentAmount 
          })
          .eq('id', invoiceId)
      } else {
        const purchaseDateObj = new Date(purchaseDate)
        const currentMonth = purchaseDateObj.getMonth()
        const currentYear = purchaseDateObj.getFullYear()
        
        const closingDate = new Date(currentYear, currentMonth, card.closing_day)
        const invoiceMonth = purchaseDateObj.getDate() <= card.closing_day 
          ? new Date(currentYear, currentMonth, 1)
          : new Date(currentYear, currentMonth + 1, 1)
        
        const dueDate = new Date(currentYear, currentMonth, card.due_day)
        if (dueDate < closingDate) {
          dueDate.setMonth(dueDate.getMonth() + 1)
        }

        const { data: newInvoice, error: invoiceError } = await supabase
          .from('card_invoices')
          .insert({
            user_id: user.id,
            card_id: card.id,
            reference_month: invoiceMonth.toISOString().split('T')[0],
            closing_date: closingDate.toISOString().split('T')[0],
            due_date: dueDate.toISOString().split('T')[0],
            status: 'open',
            total_amount: installmentAmount,
          })
          .select()
          .single()

        if (invoiceError || !newInvoice) {
          throw new Error('Erro ao criar fatura: ' + (invoiceError?.message || 'Erro desconhecido'))
        }

        invoiceId = newInvoice.id
      }

      // Cria a compra usando o serviço diretamente
      const { error: purchaseError } = await supabase
        .from('card_purchases')
        .insert({
          user_id: user.id,
          card_id: card.id,
          description: description.trim(),
          total_amount: totalAmount,
          installments,
          installment_amount: installmentAmount,
          current_installment: 1,
          purchase_date: purchaseDate,
          category_id: null,
          is_recurring: isRecurring,
        })
        .select()
        .single()

      if (purchaseError) {
        throw new Error(purchaseError.message || 'Erro ao criar compra')
      }

      // Invalida queries para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['card_purchases'] })
      queryClient.invalidateQueries({ queryKey: ['card_invoices'] })

      setToast({ 
        message: `Compra adicionada! ${installments}x de R$ ${installmentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
        type: 'success' 
      })
      setDescription('')
      setTotalAmount(0)
      setInstallments(1)
      setIsRecurring(false)
      setShowAddPurchase(false)
      onPurchaseAdded()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setToast({ message: errorMessage || 'Erro ao adicionar compra', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={card.name}
        size="lg"
      >
        <div className="space-y-6">
          {/* Informações do cartão */}
          <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-caption text-neutral-600 mb-1">Limite</p>
                <p className="text-body font-semibold text-neutral-900">
                  R$ {card.credit_limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-caption text-neutral-600 mb-1">Fechamento</p>
                <p className="text-body font-semibold text-neutral-900">
                  Dia {card.closing_day}
                </p>
              </div>
              <div>
                <p className="text-caption text-neutral-600 mb-1">Vencimento</p>
                <p className="text-body font-semibold text-neutral-900">
                  Dia {card.due_day}
                </p>
              </div>
              <div>
                <p className="text-caption text-neutral-600 mb-1">Limite disponível</p>
                <p className="text-body font-semibold text-success-600">
                  R$ {(card.credit_limit - (invoiceTotal || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Fatura atual */}
          {openInvoice ? (
            <div className="p-4 bg-white rounded-lg border-2 border-danger-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-h3 font-semibold text-neutral-900">Próxima fatura</h3>
                  <p className="text-caption text-neutral-500">
                    Vencimento: {new Date(openInvoice.due_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-h2 font-bold text-danger-600">
                    R$ {(openInvoice.total_amount || 0).toLocaleString('pt-BR', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-neutral-50 rounded-lg border border-border text-center">
              <p className="text-body-sm text-neutral-500">Nenhuma fatura aberta</p>
            </div>
          )}

          {/* Compras recorrentes */}
          {recurringPurchases.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-h3 font-semibold text-neutral-900">Compras Recorrentes</h3>
                  <span className="px-2 py-1 text-caption font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
                    {recurringPurchases.length}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recurringPurchases.map((purchase: CardPurchase) => (
                    <PurchaseItem
                      key={purchase.id}
                      purchase={purchase}
                      onUpdate={(id, data, callbacks) => {
                        updatePurchase({ id, data }, {
                          onSuccess: () => {
                            queryClient.invalidateQueries({ queryKey: ['card_purchases'] })
                            queryClient.invalidateQueries({ queryKey: ['card_invoices'] })
                            callbacks?.onSuccess?.()
                          },
                          onError: (error: Error) => {
                            callbacks?.onError?.(error)
                          },
                        })
                      }}
                      onToast={(message, type) => setToast({ message, type })}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Lista de compras */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-h3 font-semibold text-neutral-900">
                {recurringPurchases.length > 0 ? 'Outras Compras' : 'Compras'}
              </h3>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddPurchase(!showAddPurchase)}
              >
                {showAddPurchase ? 'Cancelar' : '+ Adicionar compra'}
              </Button>
            </div>

            {/* Formulário de adicionar compra */}
            {showAddPurchase && (
              <div className="p-4 bg-neutral-50 rounded-lg border border-border mb-4 space-y-3">
                <Input
                  label="Descrição"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Notebook, Supermercado..."
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <CurrencyInput
                    label="Valor total"
                    value={totalAmount}
                    onChange={setTotalAmount}
                    required
                  />
                  <div>
                    <label className="block text-label font-medium text-neutral-900 mb-1.5">
                      Parcelas
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="24"
                      value={installments}
                      onChange={(e) => setInstallments(Math.max(1, parseInt(e.target.value) || 1))}
                      required
                    />
                    {installments > 1 && totalAmount > 0 && (
                      <p className="mt-1 text-caption text-neutral-500">
                        R$ {(totalAmount / installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por parcela
                      </p>
                    )}
                  </div>
                </div>
                <Input
                  label="Data da compra"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  required
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-border rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <label htmlFor="isRecurring" className="text-body-sm text-neutral-700 cursor-pointer">
                    Compra recorrente
                  </label>
                </div>
                <Button
                  variant="primary"
                  onClick={handleAddPurchase}
                  isLoading={isSubmitting}
                  className="w-full"
                >
                  Adicionar compra
                </Button>
              </div>
            )}

            {/* Lista de compras */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {nonRecurringPurchases.length === 0 && recurringPurchases.length === 0 ? (
                <div className="p-8 text-center bg-neutral-50 rounded-lg border border-border">
                  <p className="text-body-sm text-neutral-500">Nenhuma compra registrada</p>
                </div>
              ) : nonRecurringPurchases.length === 0 ? (
                <div className="p-8 text-center bg-neutral-50 rounded-lg border border-border">
                  <p className="text-body-sm text-neutral-500">Nenhuma outra compra registrada</p>
                </div>
              ) : (
                nonRecurringPurchases.map((purchase: CardPurchase) => (
                  <PurchaseItem
                    key={purchase.id}
                    purchase={purchase}
                    onUpdate={(id, data, callbacks) => {
                      updatePurchase({ id, data }, {
                        onSuccess: () => {
                          queryClient.invalidateQueries({ queryKey: ['card_purchases'] })
                          queryClient.invalidateQueries({ queryKey: ['card_invoices'] })
                          callbacks?.onSuccess?.()
                        },
                        onError: (error: Error) => {
                          callbacks?.onError?.(error)
                        },
                      })
                    }}
                    onToast={(message, type) => setToast({ message, type })}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>

      <Toast
        message={toast?.message || ''}
        type={toast?.type || 'info'}
        isVisible={!!toast}
        onClose={() => setToast(null)}
      />
    </>
  )
}

