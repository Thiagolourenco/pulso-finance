import { useState } from 'react'
import { useGoals } from '@/hooks/useGoals'
import type { Goal } from '@/services/goalService'
import { GoalCard } from '@/components/goals/GoalCard'
import { Modal } from '@/components/ui'
import { AddGoalForm } from '@/components/forms/AddGoalForm'

interface GoalFormData {
  name: string
  target_amount: number
  current_amount: number
  target_date: string
}

const initialFormData: GoalFormData = {
  name: '',
  target_amount: 0,
  current_amount: 0,
  target_date: '',
}

export const Goals = () => {
  const { goals, isLoading, createGoal, updateGoal, deleteGoal, addAmountToGoal, isCreating, isUpdating, isDeleting } = useGoals()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [, setFormData] = useState<GoalFormData>(initialFormData)
  const [amountToAdd, setAmountToAdd] = useState<{ [key: string]: string }>({})

  const handleOpenForm = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal)
      setFormData({
        name: goal.name || '',
        target_amount: goal.target_amount || 0,
        current_amount: goal.current_amount || 0,
        target_date: goal.target_date ? new Date(goal.target_date).toISOString().split('T')[0] : '',
      })
    } else {
      setEditingGoal(null)
      setFormData(initialFormData)
    }
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingGoal(null)
    setFormData(initialFormData)
  }

  const handleSubmit = async (data: {
    name: string
    target_amount: number
    target_date: string | null
    current_amount?: number
  }) => {
    const goalData = {
      name: data.name,
      target_amount: data.target_amount,
      current_amount: data.current_amount || 0,
      target_date: data.target_date || null,
    }

    if (editingGoal) {
      updateGoal({ id: editingGoal.id, data: goalData })
    } else {
      const { data: { user } } = await import('@/lib/supabase/client').then(m => m.supabase.auth.getUser())
      if (user) {
        createGoal({
          user_id: user.id,
          ...goalData,
        } as any)
      }
    }

    handleCloseForm()
  }

  const handleAddAmount = (goalId: string) => {
    const amount = parseFloat(amountToAdd[goalId] || '0')
    if (amount > 0) {
      addAmountToGoal({ id: goalId, amount })
      setAmountToAdd({ ...amountToAdd, [goalId]: '' })
    }
  }

  const handleDelete = (goalId: string) => {
    if (confirm('Tem certeza que deseja excluir esta meta?')) {
      deleteGoal(goalId)
    }
  }


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-600 dark:text-neutral-300">Carregando metas...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">Metas</h1>
        <button
          onClick={() => handleOpenForm()}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nova Meta
        </button>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        title={editingGoal ? 'Editar Meta' : 'Nova Meta'}
        size="md"
      >
        <AddGoalForm
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          isLoading={isCreating || isUpdating}
          initialData={editingGoal ? {
            name: editingGoal.name,
            target_amount: editingGoal.target_amount,
            current_amount: editingGoal.current_amount,
            target_date: editingGoal.target_date,
          } : undefined}
        />
      </Modal>

      {goals.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl rounded-lg shadow p-12 text-center border border-border dark:border-border-dark/70">
          <p className="text-neutral-600 dark:text-neutral-300 mb-4">Você ainda não tem metas cadastradas</p>
          <button
            onClick={() => handleOpenForm()}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Criar Primeira Meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <div key={goal.id} className="relative">
              <GoalCard goal={goal} />
              <div className="mt-2 flex gap-2 justify-end">
                <button
                  onClick={() => handleOpenForm(goal)}
                  className="text-body-sm text-primary-600 hover:text-primary-700 font-medium px-3 py-1"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(goal.id)}
                  className="text-body-sm text-danger-600 hover:text-danger-700 font-medium px-3 py-1"
                  disabled={isDeleting}
                >
                  Excluir
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <label className="block text-body-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Adicionar Valor
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amountToAdd[goal.id] || ''}
                    onChange={(e) => setAmountToAdd({ ...amountToAdd, [goal.id]: e.target.value })}
                    placeholder="0,00"
                    className="flex-1 px-3 py-2 border border-border dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-body-sm bg-white dark:bg-neutral-950/40 text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                  />
                  <button
                    onClick={() => handleAddAmount(goal.id)}
                    className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors text-body-sm font-medium"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}