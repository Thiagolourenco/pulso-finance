import { useState } from 'react'
import { Input, CurrencyInput, Button } from '@/components/ui'

interface AddCardFormProps {
  onSubmit: (data: {
    name: string
    limit: number
    closing_day: number
    due_day: number
  }) => void
  onCancel: () => void
  isLoading?: boolean
}

export const AddCardForm = ({
  onSubmit,
  onCancel,
  isLoading = false,
}: AddCardFormProps) => {
  const [name, setName] = useState('')
  const [limit, setLimit] = useState(0)
  const [closingDay, setClosingDay] = useState(5)
  const [dueDay, setDueDay] = useState(10)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Nome do cartão é obrigatório')
      return
    }

    if (limit <= 0) {
      setError('Limite deve ser maior que zero')
      return
    }

    onSubmit({
      name: name.trim(),
      limit,
      closing_day: closingDay,
      due_day: dueDay,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-input text-body-sm">
          {error}
        </div>
      )}

      {/* Nome do cartão */}
      <Input
        label="Nome do cartão"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: Nubank Roxo, Itaú Gold..."
        required
      />

      {/* Limite */}
      <CurrencyInput
        label="Limite do cartão"
        value={limit}
        onChange={setLimit}
        required
      />

      {/* Dia de fechamento */}
      <Input
        label="Dia de fechamento"
        type="number"
        min="1"
        max="31"
        value={closingDay}
        onChange={(e) => setClosingDay(Number(e.target.value))}
        required
      />

      {/* Dia de vencimento */}
      <Input
        label="Dia de vencimento"
        type="number"
        min="1"
        max="31"
        value={dueDay}
        onChange={(e) => setDueDay(Number(e.target.value))}
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
          Adicionar cartão
        </Button>
      </div>
    </form>
  )
}

