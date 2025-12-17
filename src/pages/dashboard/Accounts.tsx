import { useState } from 'react'
import { useAccounts } from '@/hooks/useAccounts'
import { Button, Modal, Toast } from '@/components/ui'
import { AddAccountForm } from '@/components/forms/AddAccountForm'
import type { Account } from '@/types'

export const Accounts = () => {
  const { accounts, deleteAccount, isDeleting } = useAccounts()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta? Todas as transações vinculadas serão mantidas.')) return

    deleteAccount(id, {
      onSuccess: () => {
        setToast({ message: 'Conta excluída com sucesso!', type: 'success' })
      },
      onError: (error: Error) => {
        setToast({ message: error.message || 'Erro ao excluir conta', type: 'error' })
      },
    })
  }

  const handleEdit = (account: Account) => {
    setEditingAccount(account)
    setShowAddModal(true)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingAccount(null)
  }

  const getAccountTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      bank: '🏦 Banco',
      cash: '💵 Dinheiro',
      investment: '📈 Investimento',
      wallet: '👛 Carteira'
    }
    return labels[type] || type
  }

  const getAccountTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      bank: 'bg-primary-100 text-primary-700',
      cash: 'bg-success-100 text-success-700',
      investment: 'bg-warning-100 text-warning-700',
      wallet: 'bg-purple-100 text-purple-700'
    }
    return colors[type] || 'bg-neutral-100 text-neutral-700'
  }

  // Estatísticas
  const totalBalance = accounts.reduce((sum, account) => sum + (account.current_balance || 0), 0)

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900 mb-2">Contas</h1>
          <p className="text-body-sm text-neutral-500">
            Gerencie suas contas bancárias, carteiras e investimentos
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          ➕ Nova Conta
        </Button>
      </div>

      {/* Resumo */}
      <div className="mb-8">
        <div className="p-6 bg-white rounded-card-lg border border-border">
          <p className="text-caption text-neutral-600 mb-2">Saldo Total</p>
          <p className={`text-h1 font-bold ${totalBalance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
            R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Lista de Contas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.length > 0 ? (
          accounts.map(account => (
            <div
              key={account.id}
              className="p-6 bg-white rounded-card-lg border border-border hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-body font-semibold text-neutral-900 mb-2">
                    {account.name}
                  </h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-caption font-medium ${getAccountTypeColor(account.type)}`}>
                    {getAccountTypeLabel(account.type)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(account)}
                      className="p-2 rounded-lg hover:bg-primary-50 transition-colors text-primary-600"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      disabled={isDeleting}
                      className="p-2 rounded-lg hover:bg-danger-50 transition-colors disabled:opacity-50 text-danger-600"
                      title="Excluir"
                    >
                      🗑️
                    </button>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-caption text-neutral-600">Saldo Atual</p>
                  <p className={`text-h3 font-bold ${account.current_balance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    R$ {account.current_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-caption text-neutral-600">Saldo Inicial</p>
                  <p className="text-body-sm text-neutral-500">
                    R$ {account.initial_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-12 text-center bg-white rounded-card-lg border border-border">
            <p className="text-body text-neutral-500 mb-4">
              Nenhuma conta cadastrada ainda
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              Criar Primeira Conta
            </Button>
          </div>
        )}
      </div>

      {/* Modal de Adicionar/Editar */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={handleCloseModal}
          title={editingAccount ? 'Editar Conta' : 'Nova Conta'}
        >
          <AddAccountForm
            onSubmit={async (data) => {
              // A lógica de criação/edição será gerenciada pelo hook useAccounts
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
