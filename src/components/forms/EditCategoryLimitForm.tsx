import { useState } from 'react'
import { CurrencyInput, Button } from '@/components/ui'
import type { Category } from '@/types'

interface EditCategoryLimitFormProps {
  category: Category
  onSubmit: (limit: number | null) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export const EditCategoryLimitForm = ({
  category,
  onSubmit,
  onCancel,
  isLoading = false,
}: EditCategoryLimitFormProps) => {
  const [limit, setLimit] = useState<number>(category.monthly_limit || 0)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (limit < 0) {
      setError('O limite não pode ser negativo')
      return
    }

    try {
      // Se o limite for 0, remove o limite (null)
      await onSubmit(limit === 0 ? null : limit)
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar limite')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-900/30 rounded-lg border border-border dark:border-border-dark">
        {category.icon && (
          <span className="text-2xl">{category.icon}</span>
        )}
        <div>
          <p className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50">
            {category.name}
          </p>
          <p className="text-caption text-neutral-500 dark:text-neutral-400">
            {category.type === 'expense' ? 'Categoria de despesa' : 'Categoria de receita'}
          </p>
        </div>
      </div>

      <CurrencyInput
        label="Limite mensal"
        value={limit}
        onChange={setLimit}
        helperText="Defina um limite de gasto mensal para esta categoria. Deixe em zero para remover o limite."
        required={false}
      />

      {error && (
        <div className="p-3 bg-danger-50 dark:bg-danger-950 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-300 rounded-lg text-body-sm">
          {error}
        </div>
      )}

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
          {limit === 0 ? 'Remover limite' : 'Salvar limite'}
        </Button>
      </div>
    </form>
  )
}

