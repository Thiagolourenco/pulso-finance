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
        <div className="p-4 bg-danger-50 dark:bg-danger-950 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-300 rounded-input text-body-sm">
          {error}
        </div>
      )}

      {/* Tipo de transação */}
      <div>
        <label className="block text-label font-medium text-neutral-900 dark:text-neutral-50 mb-2">
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
                  ? 'border-danger-500 bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-danger-300 font-medium'
                  : 'border-border dark:border-border-dark bg-white dark:bg-neutral-950/40 text-neutral-700 dark:text-neutral-300 hover:border-danger-300 dark:hover:border-danger-500/50'
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
                  ? 'border-success-500 bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-300 font-medium'
                  : 'border-border dark:border-border-dark bg-white dark:bg-neutral-950/40 text-neutral-700 dark:text-neutral-300 hover:border-success-300 dark:hover:border-success-500/50'
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
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 font-medium'
                  : 'border-border dark:border-border-dark bg-white dark:bg-neutral-950/40 text-neutral-700 dark:text-neutral-300 hover:border-primary-300 dark:hover:border-primary-500/50'
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
          <label className="block text-label font-medium text-neutral-900 dark:text-neutral-50 mb-1.5">
            Categoria <span className="text-neutral-500 dark:text-neutral-400 text-body-sm font-normal">(opcional)</span>
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-2.5 text-body rounded-input border-2 border-border dark:border-border-dark bg-white dark:bg-neutral-950/40 text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-400 focus:border-primary-600 dark:focus:border-primary-400 hover:border-neutral-400 dark:hover:border-neutral-700 transition-all duration-fast disabled:bg-neutral-100 dark:disabled:bg-neutral-900 disabled:cursor-not-allowed"
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
            <p className="mt-1.5 text-caption text-neutral-500 dark:text-neutral-400">Carregando categorias...</p>
          )}
          {filteredCategories.length === 0 && !isLoadingCategories && (
            <p className="mt-1.5 text-caption text-neutral-500 dark:text-neutral-400">
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

