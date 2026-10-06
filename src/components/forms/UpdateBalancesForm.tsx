import { useMemo, useState } from 'react'
import { Button, CurrencyInput } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { payloadForManualCurrentBalance } from '@/lib/utils/accountBalance'
import type { Account, Transaction } from '@/types'

interface UpdateBalancesFormProps {
  accounts: Account[]
  transactions: Transaction[]
  onSubmit: (updates: { id: string; current_balance: number; initial_balance: number }[]) => void
  onCancel: () => void
  isLoading?: boolean
}

export const UpdateBalancesForm = ({
  accounts,
  transactions,
  onSubmit,
  onCancel,
  isLoading = false,
}: UpdateBalancesFormProps) => {
  const [drafts, setDrafts] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      accounts.map(account => [account.id, Number(account.current_balance) || 0])
    )
  )

  const storedTotal = useMemo(
    () => accounts.reduce((sum, account) => sum + (Number(account.current_balance) || 0), 0),
    [accounts]
  )

  const nextTotal = useMemo(
    () => accounts.reduce((sum, account) => sum + (Number(drafts[account.id]) || 0), 0),
    [accounts, drafts]
  )

  const changedCount = accounts.filter(account => {
    const stored = Number(account.current_balance) || 0
    const next = Number(drafts[account.id]) || 0
    return Math.abs(stored - next) >= 0.009
  }).length

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const updates = accounts
      .filter(account => {
        const stored = Number(account.current_balance) || 0
        const next = Number(drafts[account.id]) || 0
        return Math.abs(stored - next) >= 0.009
      })
      .map(account => ({
        id: account.id,
        ...payloadForManualCurrentBalance(
          account.id,
          transactions,
          Number(drafts[account.id]) || 0
        ),
      }))

    onSubmit(updates)
  }

  if (accounts.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-body-sm text-neutral-500 dark:text-neutral-400">
          Cadastre uma conta antes de atualizar os saldos.
        </p>
        <Button type="button" variant="secondary" onClick={onCancel} className="w-full">
          Fechar
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-body-sm text-neutral-600 dark:text-neutral-300">
        Informe o saldo real de cada conta. O valor guardado hoje é o que o Pulso mostra no patrimônio.
      </p>

      <div className="space-y-4">
        {accounts.map(account => {
          const stored = Number(account.current_balance) || 0
          return (
            <div
              key={account.id}
              className="p-4 rounded-input border border-border dark:border-border-dark bg-white dark:bg-neutral-950/40 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-body font-medium text-neutral-900 dark:text-neutral-50">
                    {account.name}
                  </p>
                  <p className="text-caption text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Guardado: {formatCurrency(stored)}
                  </p>
                </div>
              </div>
              <CurrencyInput
                label="Novo saldo atual"
                value={drafts[account.id] ?? stored}
                onChange={value =>
                  setDrafts(current => ({
                    ...current,
                    [account.id]: value,
                  }))
                }
              />
            </div>
          )
        })}
      </div>

      <div className="p-4 rounded-input border border-primary-200/80 dark:border-primary-700/70 bg-white dark:bg-neutral-900/70">
        <p className="text-caption text-neutral-500 dark:text-neutral-400">Patrimônio total</p>
        <p className="text-caption mt-1">
          Guardado: <span className="font-medium tabular-nums">{formatCurrency(storedTotal)}</span>
        </p>
        <p className="text-h3 font-bold tabular-nums text-neutral-950 dark:text-neutral-50 mt-1">
          Novo: {formatCurrency(nextTotal)}
        </p>
      </div>

      <div className="flex gap-3 pt-2">
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
          disabled={changedCount === 0}
        >
          {changedCount === 0 ? 'Nada para salvar' : `Salvar ${changedCount} saldo(s)`}
        </Button>
      </div>
    </form>
  )
}
