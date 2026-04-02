import { useState } from 'react'
import { Input, CurrencyInput, Button } from '@/components/ui'
import type { Account } from '@/types'

interface AddAccountFormProps {
  onSubmit: (data: {
    name: string
    type: 'bank' | 'cash' | 'investment' | 'wallet'
    balance: number
  }) => void
  onCancel: () => void
  isLoading?: boolean
  initialAccount?: Account | null
}

export const AddAccountForm = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialAccount = null,
}: AddAccountFormProps) => {
  const [name, setName] = useState(initialAccount?.name || '')
  const [type, setType] = useState<'bank' | 'cash' | 'investment' | 'wallet'>(initialAccount?.type || 'bank')
  const [balance, setBalance] = useState(initialAccount?.initial_balance || 0)
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
        <div className="p-4 bg-danger-50 dark:bg-danger-950 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-300 rounded-input text-body-sm">
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
        <label className="block text-label font-medium text-neutral-900 dark:text-neutral-50 mb-2">
          Tipo de conta
        </label>
        <div className="grid grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setType('bank')}
            className={`
              px-4 py-3 rounded-input border-2 transition-all duration-fast
              ${
                type === 'bank'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 font-medium'
                  : 'border-border dark:border-border-dark bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-primary-300 dark:hover:border-primary-500/60'
              }
            `}
          >
            🏦 Banco
          </button>
          <button
            type="button"
            onClick={() => setType('cash')}
            className={`
              px-4 py-3 rounded-input border-2 transition-all duration-fast
              ${
                type === 'cash'
                  ? 'border-success-500 bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-300 font-medium'
                  : 'border-border dark:border-border-dark bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-success-300 dark:hover:border-success-500/60'
              }
            `}
          >
            💵 Dinheiro
          </button>
          <button
            type="button"
            onClick={() => setType('investment')}
            className={`
              px-4 py-3 rounded-input border-2 transition-all duration-fast
              ${
                type === 'investment'
                  ? 'border-warning-500 bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-warning-300 font-medium'
                  : 'border-border dark:border-border-dark bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-warning-300 dark:hover:border-warning-500/60'
              }
            `}
          >
            📈 Investimento
          </button>
          <button
            type="button"
            onClick={() => setType('wallet')}
            className={`
              px-4 py-3 rounded-input border-2 transition-all duration-fast
              ${
                type === 'wallet'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 font-medium'
                  : 'border-border dark:border-border-dark bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-purple-300 dark:hover:border-purple-500/60'
              }
            `}
          >
            👛 Carteira
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
          {initialAccount ? 'Salvar conta' : 'Criar conta'}
        </Button>
      </div>
    </form>
  )
}

