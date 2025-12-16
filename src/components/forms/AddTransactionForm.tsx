import { useState, useEffect } from 'react'
import { Input, CurrencyInput, Button } from '@/components/ui'
import { useCategories } from '@/hooks/useCategories'
import type { Category } from '@/types'

interface AddTransactionFormProps {
  onSubmit: (data: {
    description: string
    amount: number
    type: 'expense' | 'income' | 'balance'
    date: string
    category_id?: string
  }) => void
  onCancel: () => void
  isLoading?: boolean
  initialType?: 'expense' | 'income' | 'balance'
}

export const AddTransactionForm = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialType = 'expense',
}: AddTransactionFormProps) => {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState(0)
  const [type, setType] = useState<'expense' | 'income' | 'balance'>(initialType)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [categoryId, setCategoryId] = useState<string>('')
  const [error, setError] = useState('')
  
  const { categories, isLoading: isLoadingCategories } = useCategories()
  
  // Filtra categorias baseado no tipo selecionado
  const filteredCategories = categories.filter((cat: Category) => {
    if (type === 'balance') {
      // Para saldo inicial, mostra apenas categorias de receita
      return cat.type === 'income'
    }
    // Para gastos/receitas, mostra categorias do mesmo tipo
    return cat.type === type
  })

  // Reseta categoria quando o tipo muda
  useEffect(() => {
    setCategoryId('')
  }, [type])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!description.trim()) {
      setError('Descrição é obrigatória')
      return
    }

    if (amount <= 0) {
      setError('Valor deve ser maior que zero')
      return
    }

    onSubmit({
      description: description.trim(),
      amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
      type,
      date,
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

      {/* Tipo de transação */}
      <div>
        <label className="block text-label font-medium text-neutral-900 mb-2">
          Tipo
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`
              px-4 py-3 rounded-input border-2 transition-all duration-fast
              ${
                type === 'expense'
                  ? 'border-danger-500 bg-danger-50 text-danger-700 font-medium'
                  : 'border-border bg-white text-neutral-700 hover:border-danger-300'
              }
            `}
          >
            💸 Gasto
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`
              px-4 py-3 rounded-input border-2 transition-all duration-fast
              ${
                type === 'income'
                  ? 'border-success-500 bg-success-50 text-success-700 font-medium'
                  : 'border-border bg-white text-neutral-700 hover:border-success-300'
              }
            `}
          >
            💰 Receita
          </button>
          <button
            type="button"
            onClick={() => setType('balance')}
            className={`
              px-4 py-3 rounded-input border-2 transition-all duration-fast
              ${
                type === 'balance'
                  ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                  : 'border-border bg-white text-neutral-700 hover:border-primary-300'
              }
            `}
          >
            💳 Saldo inicial
          </button>
        </div>
      </div>

      {/* Categoria */}
      {type !== 'balance' && (
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
            <option value="">Selecione uma categoria (ou deixe em branco para usar padrão)</option>
            {filteredCategories.map((category: Category) => (
              <option key={category.id} value={category.id}>
                {category.icon ? `${category.icon} ` : ''}{category.name}
              </option>
            ))}
          </select>
          {isLoadingCategories && (
            <p className="mt-1.5 text-caption text-neutral-500">Carregando categorias...</p>
          )}
          {filteredCategories.length === 0 && !isLoadingCategories && (
            <p className="mt-1.5 text-caption text-neutral-500">
              Nenhuma categoria encontrada. A categoria padrão "Outros" será usada.
            </p>
          )}
        </div>
      )}

      {/* Descrição */}
      <Input
        label="Descrição"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Ex: Almoço, Salário, Uber..."
        required
      />

      {/* Valor */}
      <CurrencyInput
        label="Valor"
        value={amount}
        onChange={setAmount}
        required
      />

      {/* Data */}
      <Input
        label="Data"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

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
          {type === 'balance' ? 'Adicionar saldo' : 'Adicionar'}
        </Button>
      </div>
    </form>
  )
}

