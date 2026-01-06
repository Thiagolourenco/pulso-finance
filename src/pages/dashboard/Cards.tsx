import { useState } from 'react'
import { useCards } from '@/hooks/useCards'
import { useCardInvoices } from '@/hooks/useCardInvoices'
import { useCardPurchases } from '@/hooks/useCardPurchases'
import { Button, Modal, Toast } from '@/components/ui'
import { AddCardForm } from '@/components/forms/AddCardForm'
import { CardDetailsModal } from '@/components/modals/CardDetailsModal'
import type { Card } from '@/types'

export const Cards = () => {
  const { cards, deleteCard, isDeleting } = useCards()
  const { invoices } = useCardInvoices()
  const { purchases } = useCardPurchases()

  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cartão? Todas as compras e faturas vinculadas serão mantidas.')) return

    deleteCard(id, {
      onSuccess: () => {
        setToast({ message: 'Cartão excluído com sucesso!', type: 'success' })
      },
      onError: (error: Error) => {
        setToast({ message: error.message || 'Erro ao excluir cartão', type: 'error' })
      },
    })
  }

  const handleEdit = (card: Card) => {
    setEditingCard(card)
    setShowAddModal(true)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingCard(null)
  }

  const handleCardClick = (cardId: string) => {
    setSelectedCardId(cardId)
  }

  // Calcula estatísticas por cartão
  const getCardStats = (cardId: string) => {
    const cardInvoices = invoices.filter(inv => inv.card_id === cardId)
    const cardPurchases = purchases.filter(p => p.card_id === cardId)

    const openInvoices = cardInvoices.filter(inv => inv.status === 'open')
    const totalOpenInvoices = openInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)

    const pendingPurchases = cardPurchases.filter(p => p.current_installment <= p.installments)
    const totalPendingPurchases = pendingPurchases.reduce((sum, p) => {
      const remainingInstallments = p.installments - p.current_installment + 1
      return sum + (p.installment_amount * remainingInstallments)
    }, 0)

    return {
      totalOpenInvoices,
      totalPendingPurchases,
      availableLimit: 0 // Será calculado baseado no limite e gastos
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-border dark:border-border-dark">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900 dark:text-neutral-50 mb-2">Cartões</h1>
          <p className="text-body-sm text-neutral-500 dark:text-neutral-400">
            Gerencie seus cartões de crédito e débito
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          ➕ Novo Cartão
        </Button>
      </div>

      {/* Lista de Cartões */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.length > 0 ? (
          cards.map(card => {
            const stats = getCardStats(card.id)
            const usedLimit = stats.totalOpenInvoices
            const availableLimit = card.credit_limit - usedLimit
            const usagePercentage = card.credit_limit > 0 ? (usedLimit / card.credit_limit) * 100 : 0

            return (
              <div
                key={card.id}
                className="p-6 bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl rounded-card-lg border border-border dark:border-border-dark/70 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handleCardClick(card.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center text-2xl">
                      💳
                    </div>
                    <div>
                      <h3 className="text-body font-semibold text-neutral-900 dark:text-neutral-50">
                        {card.name}
                      </h3>
                      <p className="text-caption text-neutral-500 dark:text-neutral-400">
                        Limite: R$ {card.credit_limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(card)}
                      className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors text-primary-600 dark:text-primary-400"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(card.id)}
                      disabled={isDeleting}
                      className="p-2 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors disabled:opacity-50 text-danger-600 dark:text-danger-400"
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Barra de uso do limite */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-caption text-neutral-600 dark:text-neutral-300">Uso do Limite</p>
                      <p className={`text-caption font-medium ${usagePercentage > 80 ? 'text-danger-600 dark:text-danger-400' : usagePercentage > 50 ? 'text-warning-600 dark:text-warning-400' : 'text-success-600 dark:text-success-500'}`}>
                        {usagePercentage.toFixed(0)}%
                      </p>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          usagePercentage > 80 ? 'bg-danger-600' :
                          usagePercentage > 50 ? 'bg-warning-600' :
                          'bg-success-600'
                        }`}
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Informações */}
                  <div className="pt-3 border-t border-border dark:border-border-dark space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-caption text-neutral-600 dark:text-neutral-300">Faturas Abertas</p>
                      <p className="text-body-sm font-semibold text-neutral-900 dark:text-neutral-50">
                        R$ {stats.totalOpenInvoices.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-caption text-neutral-600 dark:text-neutral-300">Limite Disponível</p>
                      <p className={`text-body-sm font-semibold ${availableLimit >= 0 ? 'text-success-600 dark:text-success-500' : 'text-danger-600 dark:text-danger-400'}`}>
                        R$ {availableLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-caption text-neutral-600 dark:text-neutral-300">Fechamento</p>
                      <p className="text-body-sm text-neutral-500 dark:text-neutral-400">
                        Dia {card.closing_day}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-caption text-neutral-600 dark:text-neutral-300">Vencimento</p>
                      <p className="text-body-sm text-neutral-500 dark:text-neutral-400">
                        Dia {card.due_day}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="col-span-full p-12 text-center bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl rounded-card-lg border border-border dark:border-border-dark/70">
            <p className="text-body text-neutral-500 dark:text-neutral-300 mb-4">
              Nenhum cartão cadastrado ainda
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              Adicionar Primeiro Cartão
            </Button>
          </div>
        )}
      </div>

      {/* Modal de Adicionar/Editar */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={handleCloseModal}
          title={editingCard ? 'Editar Cartão' : 'Novo Cartão'}
        >
          <AddCardForm
            onSubmit={async () => {
              // A lógica de criação/edição será gerenciada pelo hook useCards
              handleCloseModal()
            }}
            onCancel={handleCloseModal}
          />
        </Modal>
      )}

      {/* Modal de Detalhes do Cartão */}
      {selectedCardId && (
        <CardDetailsModal
          card={cards.find(c => c.id === selectedCardId)!}
          isOpen={!!selectedCardId}
          onClose={() => setSelectedCardId(null)}
          onPurchaseAdded={() => {}}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
