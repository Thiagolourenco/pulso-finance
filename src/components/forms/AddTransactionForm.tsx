import { useState, useEffect, useMemo } from 'react'
import { Input, CurrencyInput, Button } from '@/components/ui'
import { useCategories } from '@/hooks/useCategories'
import { useAccounts } from '@/hooks/useAccounts'
import { useCards } from '@/hooks/useCards'
import type { Category, Transaction } from '@/types'

interface AddTransactionFormProps {
  onSubmit: (data: {
    description: string
    amount: number
    type: 'expense' | 'income' | 'balance'
    date: string
    category_id?: string
    /** Conta onde o valor entra (receita) ou sai (despesa na conta); atualiza o patrimônio. */
    account_id?: string | null
    /** Despesa no cartão (type expense); não altera saldo de conta. */
    card_id?: string | null
  }) => void
  onCancel: () => void
  isLoading?: boolean
  initialType?: 'expense' | 'income' | 'balance'
  initialTransaction?: Transaction | null
}

const getInitialState = (initialTransaction: Transaction | null | undefined, initialType: 'expense' | 'income' | 'balance') => {
  if (initialTransaction) {
    const isCardExpense =
      initialTransaction.type === 'expense' && Boolean(initialTransaction.card_id)
    return {
      description: initialTransaction.description,
      amount: Math.abs(Number(initialTransaction.amount)),
      type: initialTransaction.type as 'expense' | 'income' | 'balance',
      date: initialTransaction.date.split('T')[0],
      categoryId: initialTransaction.category_id || '',
      accountId: initialTransaction.account_id || '',
      cardId: initialTransaction.card_id || '',
      expenseSource: (isCardExpense ? 'card' : 'account') as 'account' | 'card',
    }
  }
  return {
    description: '',
    amount: 0,
    type: initialType,
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    accountId: '',
    cardId: '',
    expenseSource: 'account' as const,
  }
}

export const AddTransactionForm = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialType = 'expense',
  initialTransaction = null,
}: AddTransactionFormProps) => {
  const initialState = getInitialState(initialTransaction, initialType)
  const [description, setDescription] = useState(initialState.description)
  const [amount, setAmount] = useState(initialState.amount)
  const [type, setType] = useState<'expense' | 'income' | 'balance'>(initialState.type)
  const [date, setDate] = useState(initialState.date)
  const [categoryId, setCategoryId] = useState<string>(initialState.categoryId)
  const [accountId, setAccountId] = useState<string>(initialState.accountId)
  const [cardId, setCardId] = useState<string>(initialState.cardId)
  const [expenseSource, setExpenseSource] = useState<'account' | 'card'>(initialState.expenseSource)
  const [error, setError] = useState('')
  
  const { categories, isLoading: isLoadingCategories } = useCategories()
  const { accounts, isLoading: isLoadingAccounts } = useAccounts()
  const { cards, isLoading: isLoadingCards } = useCards()

  useEffect(() => {
    if (initialTransaction) return
    if (type !== 'income' && type !== 'expense') return
    if (type === 'expense' && expenseSource === 'card') return
    if (accounts.length !== 1) return
    if (accountId) return
    setAccountId(accounts[0].id)
  }, [initialTransaction, type, expenseSource, accounts, accountId])

  useEffect(() => {
    if (initialTransaction) return
    if (type !== 'expense' || expenseSource !== 'card') return
    if (cards.length !== 1) return
    if (cardId) return
    setCardId(cards[0].id)
  }, [initialTransaction, type, expenseSource, cards, cardId])

  const selectedAccount = useMemo(
    () => (accountId ? accounts.find(a => a.id === accountId) : undefined),
    [accounts, accountId]
  )

  const selectedCard = useMemo(
    () => (cardId ? cards.find(c => c.id === cardId) : undefined),
    [cards, cardId]
  )

  const formatBRL = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

  // Filtra categorias baseado no tipo selecionado
  const filteredCategories = categories.filter((cat: Category) => {
    if (type === 'balance') {
      // Para saldo inicial, mostra apenas categorias de receita
      return cat.type === 'income'
    }
    // Para gastos/receitas, mostra categorias do mesmo tipo
    return cat.type === type
  })

  const handleTypeChange = (newType: 'expense' | 'income' | 'balance') => {
    setType(newType)
    setCategoryId('')
    if (newType === 'balance') {
      setAccountId('')
      setCardId('')
    }
    if (newType === 'income') {
      setCardId('')
      setExpenseSource('account')
    }
    if (newType === 'expense' && !initialTransaction) {
      setExpenseSource('account')
      setCardId('')
    }
  }

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

    if (type === 'income') {
      if (accounts.length === 0) {
        setError('Cadastre uma conta em Contas para que o valor atualize o patrimônio.')
        return
      }
      if (!accountId) {
        setError('Selecione a conta em que o valor entra ou sai.')
        return
      }
    }

    if (type === 'expense' && expenseSource === 'account') {
      if (accounts.length === 0) {
        setError('Cadastre uma conta em Contas para registrar o gasto.')
        return
      }
      if (!accountId) {
        setError('Selecione a conta em que o valor sai.')
        return
      }
    }

    if (type === 'expense' && expenseSource === 'card') {
      if (cards.length === 0) {
        setError('Cadastre um cartão em Cartões para registrar o gasto no crédito.')
        return
      }
      if (!cardId) {
        setError('Selecione o cartão de crédito.')
        return
      }
    }

    const isExpenseOnCard = type === 'expense' && expenseSource === 'card'

    onSubmit({
      description: description.trim(),
      amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
      type,
      date,
      category_id: categoryId || undefined,
      account_id:
        type === 'balance'
          ? null
          : type === 'income' || (type === 'expense' && expenseSource === 'account')
            ? accountId
            : null,
      card_id: isExpenseOnCard ? cardId : null,
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
            onClick={() => handleTypeChange('expense')}
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
            onClick={() => handleTypeChange('income')}
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
            onClick={() => handleTypeChange('balance')}
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

        {type === 'expense' && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              type="button"
              onClick={() => {
                setExpenseSource('account')
                setCardId('')
              }}
              className={`
              px-4 py-3 rounded-input border-2 transition-all duration-fast
              ${
                expenseSource === 'account'
                  ? 'border-danger-500 bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-danger-300 font-medium'
                  : 'border-border dark:border-border-dark bg-white dark:bg-neutral-950/40 text-neutral-700 dark:text-neutral-300 hover:border-danger-300 dark:hover:border-danger-500/50'
              }
            `}
            >
              Na conta
            </button>
            <button
              type="button"
              onClick={() => {
                setExpenseSource('card')
                setAccountId('')
              }}
              className={`
              px-4 py-3 rounded-input border-2 transition-all duration-fast
              ${
                expenseSource === 'card'
                  ? 'border-danger-500 bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-danger-300 font-medium'
                  : 'border-border dark:border-border-dark bg-white dark:bg-neutral-950/40 text-neutral-700 dark:text-neutral-300 hover:border-danger-300 dark:hover:border-danger-500/50'
              }
            `}
            >
              No cartão
            </button>
          </div>
        )}
      </div>

      {/* Conta — receitas e despesas na conta atualizam o saldo (patrimônio) */}
      {(type === 'income' || (type === 'expense' && expenseSource === 'account')) && (
        <div>
          <label className="block text-label font-medium text-neutral-900 dark:text-neutral-50 mb-1.5">
            Conta
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full px-4 py-2.5 text-body rounded-input border-2 border-border dark:border-border-dark bg-white dark:bg-neutral-950/40 text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-400 focus:border-primary-600 dark:focus:border-primary-400 hover:border-neutral-400 dark:hover:border-neutral-700 transition-all duration-fast disabled:bg-neutral-100 dark:disabled:bg-neutral-900 disabled:cursor-not-allowed"
            disabled={isLoadingAccounts || accounts.length === 0}
            required
          >
            <option value="">Selecione a conta</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
                {acc.type === 'investment' ? ' (investimento)' : ''}
              </option>
            ))}
          </select>
          {isLoadingAccounts && (
            <p className="mt-1.5 text-caption text-neutral-500 dark:text-neutral-400">Carregando contas...</p>
          )}
          {!isLoadingAccounts && accounts.length === 0 && (
            <p className="mt-1.5 text-caption text-warning-600 dark:text-warning-400">
              Nenhuma conta cadastrada. Crie uma em Contas para registrar receitas e despesas.
            </p>
          )}
          {accounts.length > 0 && (
            <p className="mt-1.5 text-caption text-neutral-500 dark:text-neutral-400">
              O saldo desta conta será atualizado automaticamente (patrimônio total).
            </p>
          )}
        </div>
      )}

      {type === 'expense' && expenseSource === 'card' && (
        <div>
          <label className="block text-label font-medium text-neutral-900 dark:text-neutral-50 mb-1.5">
            Cartão de crédito
          </label>
          <select
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
            className="w-full px-4 py-2.5 text-body rounded-input border-2 border-border dark:border-border-dark bg-white dark:bg-neutral-950/40 text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-400 focus:border-primary-600 dark:focus:border-primary-400 hover:border-neutral-400 dark:hover:border-neutral-700 transition-all duration-fast disabled:bg-neutral-100 dark:disabled:bg-neutral-900 disabled:cursor-not-allowed"
            disabled={isLoadingCards || cards.length === 0}
            required
          >
            <option value="">Selecione o cartão</option>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {isLoadingCards && (
            <p className="mt-1.5 text-caption text-neutral-500 dark:text-neutral-400">Carregando cartões...</p>
          )}
          {!isLoadingCards && cards.length === 0 && (
            <p className="mt-1.5 text-caption text-warning-600 dark:text-warning-400">
              Nenhum cartão cadastrado. Crie um em Cartões para registrar gastos no crédito.
            </p>
          )}
          {cards.length > 0 && (
            <p className="mt-1.5 text-caption text-neutral-500 dark:text-neutral-400">
              Gasto no crédito: o saldo das suas contas não muda até a fatura ser paga a partir de uma conta.
            </p>
          )}
        </div>
      )}

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

      {(type === 'income' || (type === 'expense' && expenseSource === 'account')) && selectedAccount && (
        <div className="p-4 rounded-input border border-primary-200/80 dark:border-primary-700/70 bg-white dark:bg-neutral-900/70 shadow-sm">
          <p className="text-caption font-medium text-primary-700 dark:text-primary-300 mb-1">
            Saldo atual nesta conta (patrimônio)
          </p>
          <p className="text-2xl font-bold text-neutral-950 dark:text-neutral-50 tabular-nums">
            {formatBRL(Number(selectedAccount.current_balance) || 0)}
          </p>
          {!initialTransaction && amount > 0 && (
            <p className="text-caption text-neutral-700 dark:text-neutral-300 mt-2 pt-2 border-t border-primary-100 dark:border-primary-900/70">
              {type === 'income' ? 'Depois de salvar (estimado)' : 'Depois de salvar (estimado)'}:{' '}
              <span className="font-semibold text-primary-700 dark:text-primary-300 tabular-nums">
                {formatBRL(
                  type === 'income'
                    ? (Number(selectedAccount.current_balance) || 0) + amount
                    : (Number(selectedAccount.current_balance) || 0) - amount
                )}
              </span>
            </p>
          )}
        </div>
      )}

      {type === 'expense' && expenseSource === 'card' && selectedCard && (
        <div className="p-4 rounded-input border border-primary-200/80 dark:border-primary-700/70 bg-white dark:bg-neutral-900/70 shadow-sm">
          <p className="text-caption font-medium text-primary-700 dark:text-primary-300 mb-1">
            Limite do cartão
          </p>
          <p className="text-2xl font-bold text-neutral-950 dark:text-neutral-50 tabular-nums">
            {formatBRL(Number(selectedCard.credit_limit) || 0)}
          </p>
        </div>
      )}

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
          {initialTransaction
            ? 'Salvar'
            : type === 'balance'
              ? 'Adicionar saldo'
              : 'Adicionar'}
        </Button>
      </div>
    </form>
  )
}

