import { useState, useEffect } from 'react'
import { Input, CurrencyInput, Button } from '@/components/ui'
import { useCards } from '@/hooks/useCards'
import { useCategories } from '@/hooks/useCategories'
import type { Card, Category } from '@/types'

interface AddCardPurchaseFormProps {
  onSubmit: (data: {
    card_id: string
    description: string
    total_amount: number
    installments: number
    purchase_date: string
    category_id?: string
  }) => void
  onCancel: () => void
  isLoading?: boolean
  initialCardId?: string
}

export const AddCardPurchaseForm = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialCardId,
}: AddCardPurchaseFormProps) => {
  const [cardId, setCardId] = useState(initialCardId || '')
  const [description, setDescription] = useState('')
  const [totalAmount, setTotalAmount] = useState(0)
  const [installments, setInstallments] = useState(1)
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [categoryId, setCategoryId] = useState('')
  const [error, setError] = useState('')

  const { cards, isLoading: isLoadingCards } = useCards()
  const { categories, isLoading: isLoadingCategories } = useCategories()

  // Filtra apenas categorias de despesa
  const expenseCategories = categories.filter((cat: Category) => cat.type === 'expense')

  // Calcula valor da parcela
  const installmentAmount = installments > 0 && totalAmount > 0 
    ? totalAmount / installments 
    : 0

  useEffect(() => {
    if (initialCardId) {
      setTimeout(() => {
        setCardId(initialCardId)
      }, 0)
    }
  }, [initialCardId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!cardId) {
      setError('Selecione um cartão')
      return
    }

    if (!description.trim()) {
      setError('Descrição é obrigatória')
      return
    }

    if (totalAmount <= 0) {
      setError('Valor total deve ser maior que zero')
      return
    }

    if (installments < 1) {
      setError('Número de parcelas deve ser pelo menos 1')
      return
    }

    onSubmit({
      card_id: cardId,
      description: description.trim(),
      total_amount: totalAmount,
      installments,
      purchase_date: purchaseDate,
      category_id: categoryId || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-input text-body-sm">
          {error}
        </div>
      )}

      {/* Seleção de cartão */}
      <div>
        <label className="block text-label font-medium text-neutral-900 mb-1.5">
          Cartão <span className="text-danger-500">*</span>
        </label>
        <select
          value={cardId}
          onChange={(e) => setCardId(e.target.value)}
          className="w-full px-4 py-2.5 text-body rounded-input border-2 border-border bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 hover:border-neutral-400 transition-all duration-fast disabled:bg-neutral-100 disabled:cursor-not-allowed"
          disabled={isLoadingCards || !!initialCardId}
          required
        >
          <option value="">Selecione um cartão</option>
          {cards.map((card: Card) => (
            <option key={card.id} value={card.id}>
              {card.name} (Limite: R$ {card.credit_limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
            </option>
          ))}
        </select>
        {cards.length === 0 && !isLoadingCards && (
          <p className="mt-1.5 text-caption text-neutral-500">
            Nenhum cartão cadastrado. Adicione um cartão primeiro.
          </p>
        )}
      </div>

      {/* Descrição */}
      <Input
        label="Descrição"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Ex: Notebook, Supermercado, Roupas..."
        required
      />

      {/* Valor total */}
      <CurrencyInput
        label="Valor total"
        value={totalAmount}
        onChange={setTotalAmount}
        required
      />

      {/* Número de parcelas */}
      <div>
        <label className="block text-label font-medium text-neutral-900 mb-1.5">
          Número de parcelas <span className="text-danger-500">*</span>
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
          <p className="mt-1.5 text-caption text-neutral-500">
            Valor por parcela: R$ {installmentAmount.toLocaleString('pt-BR', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </p>
        )}
      </div>

      {/* Categoria (opcional) */}
      <div>
        <label className="block text-label font-medium text-neutral-900 mb-1.5">
          Categoria <span className="text-neutral-500 text-body-sm font-normal">(opcional)</span>
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full px-4 py-2.5 text-body rounded-input border-2 border-border bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 hover:border-neutral-400 transition-all duration-fast disabled:bg-neutral-100 disabled:cursor-not-allowed"
          disabled={isLoadingCategories}
        >
          <option value="">Selecione uma categoria (ou deixe em branco)</option>
          {expenseCategories.map((category: Category) => (
            <option key={category.id} value={category.id}>
              {category.icon ? `${category.icon} ` : ''}{category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Data da compra */}
      <Input
        label="Data da compra"
        type="date"
        value={purchaseDate}
        onChange={(e) => setPurchaseDate(e.target.value)}
        required
      />

      {/* Resumo */}
      {totalAmount > 0 && installments > 0 && (
        <div className="p-4 bg-primary-50 rounded-input border border-primary-200">
          <h3 className="text-label font-semibold text-neutral-900 mb-2">Resumo da compra</h3>
          <div className="space-y-1 text-body-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">Valor total:</span>
              <span className="font-semibold text-neutral-900">
                R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Parcelas:</span>
              <span className="font-semibold text-neutral-900">{installments}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Valor por parcela:</span>
              <span className="font-semibold text-neutral-900">
                R$ {installmentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          isLoading={isLoading}
        >
          Adicionar compra
        </Button>
      </div>
    </form>
  )
}


