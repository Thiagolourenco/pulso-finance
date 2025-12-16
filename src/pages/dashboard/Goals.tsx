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
  const [formData, setFormData] = useState<GoalFormData>(initialFormData)
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

  const getProgressPercentage = (goal: Goal) => {
    if (!goal.target_amount || goal.target_amount === 0) return 0
    const percentage = ((goal.current_amount || 0) / goal.target_amount) * 100
    return Math.min(percentage, 100)
  }

  const getGoalStatus = (goal: Goal) => {
    const targetDate = goal.target_date ? new Date(goal.target_date) : null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isCompleted = (goal.current_amount || 0) >= (goal.target_amount || 0)
    const isExpired = targetDate && targetDate < today && !isCompleted

    if (isCompleted) return { label: 'Concluída', color: 'bg-green-500' }
    if (isExpired) return { label: 'Expirada', color: 'bg-red-500' }
    return { label: 'Em andamento', color: 'bg-blue-500' }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Carregando metas...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Metas</h1>
        <button
          onClick={() => handleOpenForm()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
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
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 mb-4">Você ainda não tem metas cadastradas</p>
          <button
            onClick={() => handleOpenForm()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
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
                <label className="block text-body-sm font-medium text-neutral-700 mb-2">
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
                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-body-sm"
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