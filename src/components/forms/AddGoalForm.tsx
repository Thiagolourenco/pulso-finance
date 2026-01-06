import { useState } from 'react'
import { Input, CurrencyInput, Button } from '@/components/ui'

interface AddGoalFormProps {
  onSubmit: (data: {
    name: string
    target_amount: number
    target_date: string | null
    current_amount?: number
  }) => void
  onCancel: () => void
  isLoading?: boolean
  initialData?: {
    name?: string
    target_amount?: number
    current_amount?: number
    target_date?: string | null
  }
}

export const AddGoalForm = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
}: AddGoalFormProps) => {
  const [name, setName] = useState(initialData?.name || '')
  const [targetAmount, setTargetAmount] = useState(initialData?.target_amount || 0)
  const [currentAmount, setCurrentAmount] = useState(initialData?.current_amount || 0)
  const [targetDate, setTargetDate] = useState(
    initialData?.target_date ? new Date(initialData.target_date).toISOString().split('T')[0] : ''
  )
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Nome da meta é obrigatório')
      return
    }

    if (targetAmount <= 0) {
      setError('Valor alvo deve ser maior que zero')
      return
    }

    if (currentAmount < 0) {
      setError('Valor atual não pode ser negativo')
      return
    }

    if (currentAmount > targetAmount) {
      setError('Valor atual não pode ser maior que o valor alvo')
      return
    }

    onSubmit({
      name: name.trim(),
      target_amount: targetAmount,
      current_amount: currentAmount,
      target_date: targetDate || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-danger-50 dark:bg-danger-950 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-300 rounded-input text-body-sm">
          {error}
        </div>
      )}

      {/* Nome da meta */}
      <Input
        label="Nome da meta"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: Reserva de emergência, Viagem..."
        required
      />

      {/* Valor alvo */}
      <CurrencyInput
        label="Valor alvo"
        value={targetAmount}
        onChange={setTargetAmount}
        required
      />

      {/* Valor atual */}
      <CurrencyInput
        label="Valor atual (opcional)"
        value={currentAmount}
        onChange={setCurrentAmount}
        helperText={
          initialData?.current_amount && initialData.current_amount > 0
            ? `Pré-preenchido com o total de investimentos (R$ ${initialData.current_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`
            : "Quanto você já tem guardado para esta meta"
        }
      />

      {/* Prazo */}
      <Input
        label="Prazo (opcional)"
        type="date"
        value={targetDate}
        onChange={(e) => setTargetDate(e.target.value)}
        min={new Date().toISOString().split('T')[0]}
        helperText="Data limite para alcançar a meta"
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
          Criar meta
        </Button>
      </div>
    </form>
  )
}

