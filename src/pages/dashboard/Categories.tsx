import { useState } from 'react'
import { useCategories } from '@/hooks/useCategories'
import { useTransactions } from '@/hooks/useTransactions'
import { Button, Modal, Toast } from '@/components/ui'
import { AddCategoryForm } from '@/components/forms/AddCategoryForm'
import { EditCategoryLimitForm } from '@/components/forms/EditCategoryLimitForm'
import type { Category } from '@/types'

export const Categories = () => {
  const { categories, deleteCategory, isDeleting, updateCategory, isUpdating } = useCategories()
  const { transactions } = useTransactions()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingLimitCategory, setEditingLimitCategory] = useState<Category | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const handleDelete = async (id: string) => {
    // Verifica se há transações usando esta categoria
    const hasTransactions = transactions.some(t => t.category_id === id)
    
    if (hasTransactions) {
      setToast({ 
        message: 'Não é possível excluir uma categoria que possui transações vinculadas', 
        type: 'error' 
      })
      return
    }

    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return

    deleteCategory(id, {
      onSuccess: () => {
        setToast({ message: 'Categoria excluída com sucesso!', type: 'success' })
      },
      onError: (error: Error) => {
        setToast({ message: error.message || 'Erro ao excluir categoria', type: 'error' })
      },
    })
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setShowAddModal(true)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingCategory(null)
  }

  const handleEditLimit = (category: Category) => {
    setEditingLimitCategory(category)
  }

  const handleCloseLimitModal = () => {
    setEditingLimitCategory(null)
  }

  const handleSaveLimit = async (limit: number | null) => {
    if (!editingLimitCategory) return

    updateCategory(
      {
        id: editingLimitCategory.id,
        data: { monthly_limit: limit },
      },
      {
        onSuccess: () => {
          setToast({ 
            message: limit === null 
              ? 'Limite removido com sucesso!' 
              : 'Limite atualizado com sucesso!', 
            type: 'success' 
          })
          handleCloseLimitModal()
        },
        onError: (error: Error) => {
          setToast({ 
            message: error.message || 'Erro ao atualizar limite', 
            type: 'error' 
          })
        },
      }
    )
  }

  const getCategoryTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      expense: '💸 Despesa',
      income: '💰 Receita'
    }
    return labels[type] || type
  }

  const getCategoryTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      expense: 'bg-danger-100 text-danger-700',
      income: 'bg-success-100 text-success-700'
    }
    return colors[type] || 'bg-neutral-100 text-neutral-700'
  }

  // Calcula estatísticas por categoria
  const getCategoryStats = (categoryId: string) => {
    const categoryTransactions = transactions.filter(t => t.category_id === categoryId)
    const totalAmount = categoryTransactions.reduce((sum, t) => {
      return sum + Math.abs(Number(t.amount) || 0)
    }, 0)
    return {
      transactionCount: categoryTransactions.length,
      totalAmount
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-border dark:border-border-dark">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900 dark:text-neutral-50 mb-2">Categorias</h1>
          <p className="text-body-sm text-neutral-500 dark:text-neutral-400">
            Organize suas transações por categorias personalizadas
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          ➕ Nova Categoria
        </Button>
      </div>

      {/* Lista de Categorias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.length > 0 ? (
          categories.map(category => {
            const stats = getCategoryStats(category.id)

            return (
              <div
                key={category.id}
                className="p-6 bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl rounded-card-lg border border-border dark:border-border-dark/70 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    {category.icon && (
                      <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center text-2xl">
                        {category.icon}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-body font-semibold text-neutral-900 dark:text-neutral-50 truncate">
                        {category.name}
                      </h3>
                      <span className={`inline-block mt-1 px-2 py-1 rounded-full text-caption font-medium ${getCategoryTypeColor(category.type)} dark:opacity-90`}>
                        {getCategoryTypeLabel(category.type)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors text-primary-600 dark:text-primary-400"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      disabled={isDeleting}
                      className="p-2 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors disabled:opacity-50 text-danger-600 dark:text-danger-400"
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-border dark:border-border-dark space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-caption text-neutral-600 dark:text-neutral-300">Transações</p>
                    <p className="text-body-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      {stats.transactionCount}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-caption text-neutral-600 dark:text-neutral-300">Total Gasto</p>
                    <p className="text-body-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      R$ {stats.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  {category.type === 'expense' && (
                    <div className="pt-2 border-t border-border dark:border-border-dark">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-caption text-neutral-600 dark:text-neutral-300">Limite mensal</p>
                        {category.monthly_limit ? (
                          <p className="text-body-sm font-semibold text-neutral-900 dark:text-neutral-50">
                            R$ {category.monthly_limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        ) : (
                          <p className="text-caption text-neutral-400 dark:text-neutral-500">Não definido</p>
                        )}
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditLimit(category)}
                        className="w-full"
                      >
                        {category.monthly_limit ? '✏️ Editar limite' : '➕ Definir limite'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="col-span-full p-12 text-center bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl rounded-card-lg border border-border dark:border-border-dark/70">
            <p className="text-body text-neutral-500 dark:text-neutral-300 mb-4">
              Nenhuma categoria cadastrada ainda
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              Criar Primeira Categoria
            </Button>
          </div>
        )}
      </div>

      {/* Modal de Adicionar/Editar */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={handleCloseModal}
          title={editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
        >
          <AddCategoryForm
            onSubmit={async () => {
              // A lógica de criação/edição será gerenciada pelo hook useCategories
              handleCloseModal()
            }}
            onCancel={handleCloseModal}
          />
        </Modal>
      )}

      {/* Modal de Editar Limite */}
      {editingLimitCategory && (
        <Modal
          isOpen={!!editingLimitCategory}
          onClose={handleCloseLimitModal}
          title="Editar Limite Mensal"
          size="md"
        >
          <EditCategoryLimitForm
            category={editingLimitCategory}
            onSubmit={handleSaveLimit}
            onCancel={handleCloseLimitModal}
            isLoading={isUpdating}
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
