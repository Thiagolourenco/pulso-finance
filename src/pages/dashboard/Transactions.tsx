import { useState, useMemo } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import { useCards } from '@/hooks/useCards'
import { useCategories } from '@/hooks/useCategories'
import { Button, Modal, Toast } from '@/components/ui'
import { AddTransactionForm } from '@/components/forms/AddTransactionForm'
import type { Transaction } from '@/types'

export const Transactions = () => {
  const { transactions, deleteTransaction, isDeleting } = useTransactions()
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

      return true
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, filterType, filterCategory, filterAccount, searchTerm])

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
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900 mb-2">Transações</h1>
          <p className="text-body-sm text-neutral-500">
            Gerencie todas as suas transações financeiras
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          ➕ Nova Transação
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-white rounded-card-lg border border-border">
          <p className="text-caption text-neutral-600 mb-2">Total de Receitas</p>
          <p className="text-h2 font-bold text-success-600">
            R$ {stats.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-6 bg-white rounded-card-lg border border-border">
          <p className="text-caption text-neutral-600 mb-2">Total de Despesas</p>
          <p className="text-h2 font-bold text-danger-600">
            R$ {stats.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-6 bg-white rounded-card-lg border border-border">
          <p className="text-caption text-neutral-600 mb-2">Saldo</p>
          <p className={`text-h2 font-bold ${stats.balance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
            {stats.balance >= 0 ? '+' : ''}R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-6 bg-white rounded-card-lg border border-border">
          <p className="text-caption text-neutral-600 mb-2">Transações</p>
          <p className="text-h2 font-bold text-neutral-900">
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
              className="w-full px-4 py-2 border border-border rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
          <div className="p-4 bg-white rounded-card-lg border border-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-caption text-neutral-600 mb-2">Tipo</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
                  className="w-full px-4 py-2 border border-border rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Todos</option>
                  <option value="income">Receitas</option>
                  <option value="expense">Despesas</option>
                </select>
              </div>
              <div>
                <label className="block text-caption text-neutral-600 mb-2">Categoria</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Todas</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-caption text-neutral-600 mb-2">Conta</label>
                <select
                  value={filterAccount}
                  onChange={(e) => setFilterAccount(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Todas</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Transações */}
      <div className="bg-white rounded-card-lg border border-border overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <div className="divide-y divide-border">
            {filteredTransactions.map(transaction => {
              const category = categories.find(c => c.id === transaction.category_id)
              const account = accounts.find(a => a.id === transaction.account_id)
              const card = cards.find(c => c.id === transaction.card_id)

              return (
                <div
                  key={transaction.id}
                  className="p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        transaction.type === 'income' ? 'bg-success-100' : 'bg-danger-100'
                      }`}>
                        {category?.icon && (
                          <span className="text-2xl">{category.icon}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body font-medium text-neutral-900 truncate">
                          {transaction.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {category && (
                            <span className="text-caption text-neutral-500">
                              {category.icon} {category.name}
                            </span>
                          )}
                          {account && (
                            <span className="text-caption text-neutral-500">
                              • {account.name}
                            </span>
                          )}
                          {card && (
                            <span className="text-caption text-neutral-500">
                              • {card.name}
                            </span>
                          )}
                          <span className="text-caption text-neutral-500">
                            • {new Date(transaction.date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right">
                        <p className={`text-body font-bold ${
                          transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}R$ {Math.abs(Number(transaction.amount) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="p-2 rounded-lg hover:bg-primary-50 transition-colors text-primary-600"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          disabled={isDeleting}
                          className="p-2 rounded-lg hover:bg-danger-50 transition-colors disabled:opacity-50 text-danger-600"
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
            <p className="text-body text-neutral-500 mb-4">
              {searchTerm || filterType !== 'all' || filterCategory !== 'all' || filterAccount !== 'all'
                ? 'Nenhuma transação encontrada com os filtros aplicados'
                : 'Nenhuma transação cadastrada ainda'}
            </p>
            {!searchTerm && filterType === 'all' && filterCategory === 'all' && filterAccount === 'all' && (
              <Button onClick={() => setShowAddModal(true)}>
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
            initialType={editingTransaction?.type || 'expense'}
            onSubmit={async (data) => {
              // TODO: Implementar edição quando o formulário suportar
              handleCloseModal()
            }}
            onCancel={handleCloseModal}
          />
        </Modal>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
