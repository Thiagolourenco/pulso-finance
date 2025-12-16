import { useState } from 'react'
import { Input, CurrencyInput, Button } from '@/components/ui'
import { DEFAULT_CATEGORIES } from '@/lib/constants'

interface AddCategoryFormProps {
  onSubmit: (data: {
    name: string
    type: 'expense' | 'income'
    icon?: string
    color?: string
  }) => void
  onCancel: () => void
  isLoading?: boolean
}

export const AddCategoryForm = ({
  onSubmit,
  onCancel,
  isLoading = false,
}: AddCategoryFormProps) => {
  const [name, setName] = useState('')
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [selectedIcon, setSelectedIcon] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [error, setError] = useState('')

  const colors = [
    { name: 'Vermelho', value: '#FF6B6B' },
    { name: 'Azul', value: '#4ECDC4' },
    { name: 'Azul Claro', value: '#45B7D1' },
    { name: 'Verde', value: '#96CEB4' },
    { name: 'Amarelo', value: '#FFEAA7' },
    { name: 'Roxo', value: '#DDA0DD' },
    { name: 'Laranja', value: '#F39C12' },
    { name: 'Verde Escuro', value: '#2ECC71' },
    { name: 'Azul Escuro', value: '#3498DB' },
    { name: 'Roxo Escuro', value: '#9B59B6' },
  ]

  const popularIcons = ['🍔', '🚗', '🏠', '🏥', '📚', '🎬', '🛍️', '💰', '💼', '📈', '🍕', '☕', '✈️', '🎮', '💳']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Nome da categoria é obrigatório')
      return
    }

    onSubmit({
      name: name.trim(),
      type,
      icon: selectedIcon || undefined,
      color: selectedColor || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-input text-body-sm">
          {error}
        </div>
      )}

      {/* Nome da categoria */}
      <Input
        label="Nome da categoria"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: Alimentação, Transporte, Salário..."
        required
      />

      {/* Tipo da categoria */}
      <div>
        <label className="block text-label font-medium text-neutral-900 mb-2">
          Tipo da categoria <span className="text-danger-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`
              p-4 rounded-lg border-2 transition-all duration-fast text-left
              ${
                type === 'expense'
                  ? 'border-danger-500 bg-danger-50 text-danger-700'
                  : 'border-border bg-white hover:border-danger-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">💸</span>
              <div>
                <div className="font-semibold">Despesa</div>
                <div className="text-body-sm text-neutral-500">Gastos e saídas</div>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`
              p-4 rounded-lg border-2 transition-all duration-fast text-left
              ${
                type === 'income'
                  ? 'border-success-500 bg-success-50 text-success-700'
                  : 'border-border bg-white hover:border-success-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <div>
                <div className="font-semibold">Receita</div>
                <div className="text-body-sm text-neutral-500">Entradas e ganhos</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Ícone */}
      <div>
        <label className="block text-label font-medium text-neutral-900 mb-2">
          Ícone (opcional)
        </label>
        <div className="grid grid-cols-8 gap-2 mb-2">
          {popularIcons.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setSelectedIcon(icon)}
              className={`
                p-3 rounded-lg border-2 transition-all duration-fast text-2xl
                ${
                  selectedIcon === icon
                    ? 'border-primary-500 bg-primary-50 scale-110'
                    : 'border-border bg-white hover:border-primary-300'
                }
              `}
            >
              {icon}
            </button>
          ))}
        </div>
        {selectedIcon && (
          <button
            type="button"
            onClick={() => setSelectedIcon('')}
            className="text-body-sm text-neutral-500 hover:text-neutral-700"
          >
            Remover ícone
          </button>
        )}
      </div>

      {/* Cor */}
      <div>
        <label className="block text-label font-medium text-neutral-900 mb-2">
          Cor (opcional)
        </label>
        <div className="grid grid-cols-5 gap-2">
          {colors.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setSelectedColor(color.value)}
              className={`
                h-10 rounded-lg border-2 transition-all duration-fast
                ${
                  selectedColor === color.value
                    ? 'border-neutral-900 scale-110 ring-2 ring-offset-2 ring-primary-500'
                    : 'border-border hover:scale-105'
                }
              `}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
        {selectedColor && (
          <button
            type="button"
            onClick={() => setSelectedColor('')}
            className="mt-2 text-body-sm text-neutral-500 hover:text-neutral-700"
          >
            Remover cor
          </button>
        )}
      </div>


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
          Criar categoria
        </Button>
      </div>
    </form>
  )
}

