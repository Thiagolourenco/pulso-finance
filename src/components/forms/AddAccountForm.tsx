import { useState } from 'react'
import { Input, CurrencyInput, Button } from '@/components/ui'

interface AddAccountFormProps {
  onSubmit: (data: {
    name: string
    type: 'checking' | 'savings' | 'investment'
    balance: number
  }) => void
  onCancel: () => void
  isLoading?: boolean
}

export const AddAccountForm = ({
  onSubmit,
  onCancel,
  isLoading = false,
}: AddAccountFormProps) => {
  const [name, setName] = useState('')
  const [type, setType] = useState<'checking' | 'savings' | 'investment'>('checking')
  const [balance, setBalance] = useState(0)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Nome da conta é obrigatório')
      return
    }

    onSubmit({
      name: name.trim(),
      type,
      balance,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-input text-body-sm">
          {error}
        </div>
      )}

      {/* Nome da conta */}
      <Input
        label="Nome da conta"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: Nubank, Carteira, Poupança..."
        required
      />

      {/* Tipo de conta */}
      <div>
        <label className="block text-label font-medium text-neutral-900 mb-2">
          Tipo de conta
        </label>
        <div className="grid grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setType('checking')}
            className={`
              px-4 py-3 rounded-input border-2 transition-all duration-fast
              ${
                type === 'checking'
                  ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                  : 'border-border bg-white text-neutral-700 hover:border-primary-300'
              }
            `}
          >
            🏦 Banco
          </button>
          <button
            type="button"
            onClick={() => setType('savings')}
            className={`
              px-4 py-3 rounded-input border-2 transition-all duration-fast
              ${
                type === 'savings'
                  ? 'border-success-500 bg-success-50 text-success-700 font-medium'
                  : 'border-border bg-white text-neutral-700 hover:border-success-300'
              }
            `}
          >
            💰 Carteira
          </button>
          <button
            type="button"
            onClick={() => setType('investment')}
            className={`
              px-4 py-3 rounded-input border-2 transition-all duration-fast
              ${
                type === 'investment'
                  ? 'border-warning-500 bg-warning-50 text-warning-700 font-medium'
                  : 'border-border bg-white text-neutral-700 hover:border-warning-300'
              }
            `}
          >
            📈 Investimento
          </button>
        </div>
      </div>

      {/* Saldo inicial */}
      <CurrencyInput
        label="Saldo inicial"
        value={balance}
        onChange={setBalance}
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
          Criar conta
        </Button>
      </div>
    </form>
  )
}

