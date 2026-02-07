import { useState, useMemo } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import { useCards } from '@/hooks/useCards'
import { useCategories } from '@/hooks/useCategories'
import { Button, Modal, Toast } from '@/components/ui'
import { AddTransactionForm } from '@/components/forms/AddTransactionForm'
import { supabase } from '@/lib/supabase/client'
import { getOrCreateDefaultCategory, getOrCreateBalanceCategory } from '@/lib/utils/categories'
import { parseLocalDate } from '@/lib/utils'
import type { Transaction } from '@/types'

export const Transactions = () => {
  const { transactions, deleteTransaction, updateTransaction, createTransaction, isDeleting, isUpdating, isCreating } = useTransactions()
  const { accounts } = useAccounts()
  const { cards } = useCards()
  const { categories } = useCategories()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterAccount, setFilterAccount] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Filtros de data
  const currentDate = new Date()
  const [filterYear, setFilterYear] = useState<number>(currentDate.getFullYear())
  const [filterMonth, setFilterMonth] = useState<number>(currentDate.getMonth() + 1)
  const [filterByDate, setFilterByDate] = useState<boolean>(false)
  
  // Filtros de valor
  const [minValue, setMinValue] = useState<string>('')
  const [maxValue, setMaxValue] = useState<string>('')

  // Filtra transações
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Filtro por tipo
      if (filterType !== 'all' && transaction.type !== filterType) return false

      // Filtro por categoria
      if (filterCategory !== 'all' && transaction.category_id !== filterCategory) return false

      // Filtro por conta
      if (filterAccount !== 'all' && transaction.account_id !== filterAccount) return false

      // Busca por descrição
      if (searchTerm && !transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) return false

      // Filtro por mês/ano (usa data local para evitar problema de fuso)
      if (filterByDate) {
        const transactionDate = parseLocalDate(transaction.date)
        const transactionMonth = transactionDate.getMonth() + 1
        const transactionYear = transactionDate.getFullYear()
        
        if (transactionMonth !== filterMonth || transactionYear !== filterYear) return false
      }

      // Filtro por valor mínimo
      if (minValue) {
        const min = parseFloat(minValue.replace(/[^\d,-]/g, '').replace(',', '.')) || 0
        const transactionAmount = Math.abs(Number(transaction.amount) || 0)
        if (transactionAmount < min) return false
      }

      // Filtro por valor máximo
      if (maxValue) {
        const max = parseFloat(maxValue.replace(/[^\d,-]/g, '').replace(',', '.')) || Infinity
        const transactionAmount = Math.abs(Number(transaction.amount) || 0)
        if (transactionAmount > max) return false
      }

      return true
    }).sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime())
  }, [transactions, filterType, filterCategory, filterAccount, searchTerm, filterByDate, filterMonth, filterYear, minValue, maxValue])

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return

    deleteTransaction(id, {
      onSuccess: () => {
        setToast({ message: 'Transação excluída com sucesso!', type: 'success' })
      },
      onError: (error: Error) => {
        setToast({ message: error.message || 'Erro ao excluir transação', type: 'error' })
      },
    })
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setShowAddModal(true)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingTransaction(null)
  }

  // Estatísticas
  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0)

    return {
      income,
      expenses,
      balance: income - expenses,
      count: filteredTransactions.length
    }
  }, [filteredTransactions])

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-border dark:border-border-dark">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900 dark:text-neutral-50 mb-2">Transações</h1>
          <p className="text-body-sm text-neutral-500 dark:text-neutral-400">
            Gerencie todas as suas transações financeiras
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTransaction(null)
            setShowAddModal(true)
          }}
          className="flex items-center gap-2"
        >
          ➕ Nova Transação
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl rounded-card-lg border border-border dark:border-border-dark/70">
          <p className="text-caption text-neutral-600 dark:text-neutral-300 mb-2">Total de Receitas</p>
          <p className="text-h2 font-bold text-success-600">
            R$ {stats.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-6 bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl rounded-card-lg border border-border dark:border-border-dark/70">
          <p className="text-caption text-neutral-600 dark:text-neutral-300 mb-2">Total de Despesas</p>
          <p className="text-h2 font-bold text-danger-600">
            R$ {stats.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-6 bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl rounded-card-lg border border-border dark:border-border-dark/70">
          <p className="text-caption text-neutral-600 dark:text-neutral-300 mb-2">Saldo</p>
          <p className={`text-h2 font-bold ${stats.balance >= 0 ? 'text-success-600 dark:text-success-500' : 'text-danger-600 dark:text-danger-400'}`}>
            {stats.balance >= 0 ? '+' : ''}R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-6 bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl rounded-card-lg border border-border dark:border-border-dark/70">
          <p className="text-caption text-neutral-600 dark:text-neutral-300 mb-2">Transações</p>
          <p className="text-h2 font-bold text-neutral-900 dark:text-neutral-50">
            {stats.count}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Buscar por descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-border dark:border-border-dark rounded-lg text-body-sm bg-white dark:bg-neutral-950/40 text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            🔍 Filtros
          </Button>
        </div>

        {showFilters && (
          <div className="p-4 bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl rounded-card-lg border border-border dark:border-border-dark/70">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-caption text-neutral-600 dark:text-neutral-300 mb-2">Tipo</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
                  className="w-full px-4 py-2 border border-border dark:border-border-dark rounded-lg text-body-sm bg-white dark:bg-neutral-950/40 text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Todos</option>
                  <option value="income">Receitas</option>
                  <option value="expense">Despesas</option>
                </select>
              </div>
              <div>
                <label className="block text-caption text-neutral-600 dark:text-neutral-300 mb-2">Categoria</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-border dark:border-border-dark rounded-lg text-body-sm bg-white dark:bg-neutral-950/40 text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Todas</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-caption text-neutral-600 dark:text-neutral-300 mb-2">Conta</label>
                <select
                  value={filterAccount}
                  onChange={(e) => setFilterAccount(e.target.value)}
                  className="w-full px-4 py-2 border border-border dark:border-border-dark rounded-lg text-body-sm bg-white dark:bg-neutral-950/40 text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Todas</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Filtros de Data */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 pt-4 border-t border-border dark:border-border-dark">
              <div className="md:col-span-1">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={filterByDate}
                    onChange={(e) => setFilterByDate(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-border dark:border-border-dark rounded focus:ring-primary-500"
                  />
                  <span className="text-caption text-neutral-600 dark:text-neutral-300">Filtrar por data</span>
                </label>
              </div>
              {filterByDate && (
                <>
                  <div>
                    <label className="block text-caption text-neutral-600 dark:text-neutral-300 mb-2">Mês</label>
                    <select
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-border dark:border-border-dark rounded-lg text-body-sm bg-white dark:bg-neutral-950/40 text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value={1}>Janeiro</option>
                      <option value={2}>Fevereiro</option>
                      <option value={3}>Março</option>
                      <option value={4}>Abril</option>
                      <option value={5}>Maio</option>
                      <option value={6}>Junho</option>
                      <option value={7}>Julho</option>
                      <option value={8}>Agosto</option>
                      <option value={9}>Setembro</option>
                      <option value={10}>Outubro</option>
                      <option value={11}>Novembro</option>
                      <option value={12}>Dezembro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-caption text-neutral-600 dark:text-neutral-300 mb-2">Ano</label>
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-border dark:border-border-dark rounded-lg text-body-sm bg-white dark:bg-neutral-950/40 text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = currentDate.getFullYear() - 2 + i
                        return (
                          <option key={year} value={year}>{year}</option>
                        )
                      })}
                    </select>
                  </div>
                </>
              )}
            </div>
            
            {/* Filtros de Valor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border dark:border-border-dark">
              <div>
                <label className="block text-caption text-neutral-600 dark:text-neutral-300 mb-2">Valor Mínimo (R$)</label>
                <input
                  type="text"
                  placeholder="Ex: 100,00"
                  value={minValue}
                  onChange={(e) => {
                    // Permite apenas números e vírgula
                    let value = e.target.value.replace(/[^\d,]/g, '')
                    // Garante apenas uma vírgula
                    const parts = value.split(',')
                    if (parts.length > 2) {
                      value = parts[0] + ',' + parts.slice(1).join('')
                    }
                    // Limita a 2 casas decimais após a vírgula
                    if (parts[1] && parts[1].length > 2) {
                      value = parts[0] + ',' + parts[1].substring(0, 2)
                    }
                    setMinValue(value)
                  }}
                  className="w-full px-4 py-2 border border-border dark:border-border-dark rounded-lg text-body-sm bg-white dark:bg-neutral-950/40 text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-caption text-neutral-600 dark:text-neutral-300 mb-2">Valor Máximo (R$)</label>
                <input
                  type="text"
                  placeholder="Ex: 1000,00"
                  value={maxValue}
                  onChange={(e) => {
                    // Permite apenas números e vírgula
                    let value = e.target.value.replace(/[^\d,]/g, '')
                    // Garante apenas uma vírgula
                    const parts = value.split(',')
                    if (parts.length > 2) {
                      value = parts[0] + ',' + parts.slice(1).join('')
                    }
                    // Limita a 2 casas decimais após a vírgula
                    if (parts[1] && parts[1].length > 2) {
                      value = parts[0] + ',' + parts[1].substring(0, 2)
                    }
                    setMaxValue(value)
                  }}
                  className="w-full px-4 py-2 border border-border dark:border-border-dark rounded-lg text-body-sm bg-white dark:bg-neutral-950/40 text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Transações */}
      <div className="bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl rounded-card-lg border border-border dark:border-border-dark/70 overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <div className="divide-y divide-border dark:divide-border-dark">
            {filteredTransactions.map(transaction => {
              const category = categories.find(c => c.id === transaction.category_id)
              const account = accounts.find(a => a.id === transaction.account_id)
              const card = cards.find(c => c.id === transaction.card_id)

              return (
                <div
                  key={transaction.id}
                  className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-950/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        transaction.type === 'income' ? 'bg-success-100 dark:bg-success-900/30' : 'bg-danger-100 dark:bg-danger-900/30'
                      }`}>
                        {category?.icon && (
                          <span className="text-2xl">{category.icon}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body font-medium text-neutral-900 dark:text-neutral-50 truncate">
                          {transaction.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {category && (
                            <span className="text-caption text-neutral-500 dark:text-neutral-400">
                              {category.icon} {category.name}
                            </span>
                          )}
                          {account && (
                            <span className="text-caption text-neutral-500 dark:text-neutral-400">
                              • {account.name}
                            </span>
                          )}
                          {card && (
                            <span className="text-caption text-neutral-500 dark:text-neutral-400">
                              • {card.name}
                            </span>
                          )}
                          <span className="text-caption text-neutral-500 dark:text-neutral-400">
                            • {parseLocalDate(transaction.date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right">
                        <p className={`text-body font-bold ${
                          transaction.type === 'income' ? 'text-success-600 dark:text-success-500' : 'text-danger-600 dark:text-danger-400'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}R$ {Math.abs(Number(transaction.amount) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors text-primary-600 dark:text-primary-400"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          disabled={isDeleting}
                          className="p-2 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors disabled:opacity-50 text-danger-600 dark:text-danger-400"
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-body text-neutral-500 dark:text-neutral-300 mb-4">
              {searchTerm || filterType !== 'all' || filterCategory !== 'all' || filterAccount !== 'all' || filterByDate || minValue || maxValue
                ? 'Nenhuma transação encontrada com os filtros aplicados'
                : 'Nenhuma transação cadastrada ainda'}
            </p>
            {!searchTerm && filterType === 'all' && filterCategory === 'all' && filterAccount === 'all' && !filterByDate && !minValue && !maxValue && (
              <Button
                onClick={() => {
                  setEditingTransaction(null)
                  setShowAddModal(true)
                }}
              >
                Criar Primeira Transação
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modal de Adicionar/Editar */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={handleCloseModal}
          title={editingTransaction ? 'Editar Transação' : 'Nova Transação'}
        >
          <AddTransactionForm
            key={editingTransaction?.id ?? 'new'}
            initialType={editingTransaction?.type || 'expense'}
            initialTransaction={editingTransaction}
            isLoading={isUpdating || isCreating}
            onSubmit={async (data) => {
              if (editingTransaction) {
                updateTransaction(
                  {
                    id: editingTransaction.id,
                    data: {
                      description: data.description,
                      amount: data.amount,
                      type: data.type === 'balance' ? 'income' : data.type,
                      date: data.date,
                      category_id: data.category_id || editingTransaction.category_id,
                    },
                  },
                  {
                    onSuccess: () => {
                      setToast({ message: 'Transação atualizada com sucesso!', type: 'success' })
                      handleCloseModal()
                    },
                    onError: (error: Error) => {
                      setToast({ message: error.message || 'Erro ao atualizar transação', type: 'error' })
                    },
                  }
                )
              } else {
                try {
                  const { data: { user } } = await supabase.auth.getUser()
                  if (!user) {
                    setToast({ message: 'Você precisa estar logado', type: 'error' })
                    return
                  }
                  let categoryId: string
                  if (data.category_id?.trim()) {
                    categoryId = data.category_id
                  } else {
                    categoryId = data.type === 'balance'
                      ? await getOrCreateBalanceCategory(user.id)
                      : await getOrCreateDefaultCategory(user.id, data.type)
                  }
                  if (!categoryId?.trim()) {
                    setToast({ message: 'Não foi possível definir a categoria.', type: 'error' })
                    return
                  }
                  if (data.type === 'balance') {
                    createTransaction({
                      user_id: user.id,
                      account_id: null,
                      category_id: categoryId,
                      type: 'income',
                      amount: Math.abs(data.amount),
                      description: `Saldo inicial: ${data.description}`,
                      date: data.date,
                    }, {
                      onSuccess: () => {
                        setToast({ message: 'Saldo inicial adicionado com sucesso!', type: 'success' })
                        handleCloseModal()
                      },
                      onError: (error: Error) => {
                        setToast({ message: error.message || 'Erro ao adicionar saldo', type: 'error' })
                      },
                    })
                  } else {
                    createTransaction({
                      user_id: user.id,
                      account_id: null,
                      category_id: categoryId,
                      type: data.type,
                      amount: Math.abs(data.amount),
                      description: data.description,
                      date: data.date,
                    }, {
                      onSuccess: () => {
                        setToast({
                          message: data.type === 'income' ? 'Receita adicionada com sucesso!' : 'Gasto adicionado com sucesso!',
                          type: 'success',
                        })
                        handleCloseModal()
                      },
                      onError: (error: Error) => {
                        setToast({ message: error.message || 'Erro ao adicionar transação', type: 'error' })
                      },
                    })
                  }
                } catch (error: unknown) {
                  setToast({
                    message: error instanceof Error ? error.message : 'Erro ao adicionar transação',
                    type: 'error',
                  })
                }
              }
            }}
            onCancel={handleCloseModal}
          />
        </Modal>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
