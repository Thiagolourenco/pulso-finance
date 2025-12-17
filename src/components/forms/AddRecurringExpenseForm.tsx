import { useState, useEffect } from 'react'
import { Input, CurrencyInput, Button } from '@/components/ui'
import { useCategories } from '@/hooks/useCategories'
import { useAccounts } from '@/hooks/useAccounts'
import type { Category } from '@/types'

interface AddRecurringExpenseFormProps {
  onSubmit: (data: {
    name: string
    amount: number
    due_day: number
    category_id?: string
    account_id?: string
    description?: string
  }) => void
  onCancel: () => void
  isLoading?: boolean
  initialData?: {
    name?: string
    amount?: number
    due_day?: number
    category_id?: string
    account_id?: string
    description?: string
  }
}

export const AddRecurringExpenseForm = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
}: AddRecurringExpenseFormProps) => {
  const [name, setName] = useState(initialData?.name || '')
  const [amount, setAmount] = useState(initialData?.amount || 0)
  const [dueDay, setDueDay] = useState(initialData?.due_day || 5)
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '')
  const [accountId, setAccountId] = useState(initialData?.account_id || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [error, setError] = useState('')

  const { categories, isLoading: isLoadingCategories } = useCategories()
  const { accounts, isLoading: isLoadingAccounts } = useAccounts()

  const expenseCategories = categories.filter((cat: Category) => cat.type === 'expense')

  useEffect(() => {
    if (initialData) {
      setTimeout(() => {
        setName(initialData.name || '')
        setAmount(initialData.amount || 0)
        setDueDay(initialData.due_day || 5)
        setCategoryId(initialData.category_id || '')
        setAccountId(initialData.account_id || '')
        setDescription(initialData.description || '')
      }, 0)
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Nome é obrigatório')
      return
    }

    if (amount <= 0) {
      setError('Valor deve ser maior que zero')
      return
    }

    if (dueDay < 1 || dueDay > 31) {
      setError('Dia de vencimento deve estar entre 1 e 31')
      return
    }

    onSubmit({
      name: name.trim(),
      amount,
      due_day: dueDay,
      category_id: categoryId || undefined,
      account_id: accountId || undefined,
      description: description.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-body-sm text-danger-700">
          {error}
        </div>
      )}

      <Input
        label="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: Financiamento do carro, Internet, Aluguel..."
        required
      />

      <CurrencyInput
        label="Valor mensal"
        value={amount}
        onChange={setAmount}
        required
      />

      <div>
        <label className="block text-label font-medium text-neutral-900 mb-1.5">
          Dia de vencimento
        </label>
        <Input
          type="number"
          min="1"
          max="31"
          value={dueDay}
          onChange={(e) => setDueDay(Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))}
          required
        />
        <p className="mt-1 text-caption text-neutral-500">
          Dia do mês em que a despesa vence
        </p>
      </div>

      <div>
        <label className="block text-label font-medium text-neutral-900 mb-1.5">
          Categoria
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          disabled={isLoadingCategories}
        >
          <option value="">Selecione uma categoria (opcional)</option>
          {expenseCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-label font-medium text-neutral-900 mb-1.5">
          Conta para pagamento
        </label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          disabled={isLoadingAccounts}
        >
          <option value="">Selecione uma conta (opcional)</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Descrição (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Observações adicionais..."
      />

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="flex-1"
        >
          {initialData ? 'Atualizar' : 'Adicionar'}
        </Button>
      </div>
    </form>
  )
}


