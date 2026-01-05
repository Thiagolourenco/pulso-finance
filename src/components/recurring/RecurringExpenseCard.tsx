import { useState, useEffect } from 'react'
import type { RecurringExpense, Category } from '@/types'

interface RecurringExpenseCardProps {
  expense: RecurringExpense & { is_paid_current_month?: boolean }
  category?: Category
  onEdit?: (expense: RecurringExpense) => void
  onDelete?: (id: string) => void
  onToggleActive?: (id: string, isActive: boolean) => void
  onUpdate?: (id: string, data: { is_paid_current_month?: boolean }, callbacks?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
  onToast?: (message: string, type: 'success' | 'error') => void
}

export const RecurringExpenseCard = ({
  expense,
  category,
  onEdit,
  onDelete,
  onUpdate,
  onToast,
}: RecurringExpenseCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaidCurrentMonth, setIsPaidCurrentMonth] = useState(expense.is_paid_current_month || false)
  const [isUpdatingPaid, setIsUpdatingPaid] = useState(false)

  // Sincroniza o valor local quando a despesa é atualizada
  useEffect(() => {
    setIsPaidCurrentMonth(expense.is_paid_current_month || false)
  }, [expense.is_paid_current_month])

  const handleDelete = async () => {
    if (!onDelete) return
    if (!confirm(`Tem certeza que deseja excluir "${expense.name}"?`)) return

    setIsDeleting(true)
    try {
      onDelete(expense.id)
    } finally {
      setIsDeleting(false)
    }
  }

  const getNextDueDate = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    let dueDate = new Date(currentYear, currentMonth, expense.due_day)

    // Se o dia de vencimento já passou este mês, mostra o próximo mês
    if (dueDate < today) {
      dueDate = new Date(currentYear, currentMonth + 1, expense.due_day)
    }

    return dueDate
  }

  const nextDueDate = getNextDueDate()
  const daysUntilDue = Math.ceil((nextDueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  
  // Verifica se está atrasada baseado apenas no dia (ignorando mês/ano)
  const today = new Date()
  const currentMonth = today.getMonth() + 1
  const currentYear = today.getFullYear()
  const todayDay = today.getDate()
  
  // Cria data normalizada para comparar apenas o dia
  const normalizedDueDate = new Date(currentYear, currentMonth - 1, expense.due_day)
  const normalizedToday = new Date(currentYear, currentMonth - 1, todayDay)
  
  const isOverdue = !isPaidCurrentMonth && normalizedDueDate < normalizedToday
  
  // Determina qual badge mostrar
  let badgeText = ''
  let badgeColor = ''
  
  if (isPaidCurrentMonth) {
    badgeText = 'PAGA'
    badgeColor = 'bg-success-100 text-success-700 border-success-300'
  } else if (isOverdue) {
    badgeText = 'ATRASADA'
    badgeColor = 'bg-danger-100 text-danger-700 border-danger-300'
  } else {
    badgeText = 'A PAGAR'
    badgeColor = 'bg-warning-100 text-warning-700 border-warning-300'
  }
  
  const handleTogglePaid = (checked: boolean) => {
    if (!onUpdate) return
    
    setIsPaidCurrentMonth(checked)
    setIsUpdatingPaid(true)
    onUpdate(
      expense.id,
      { is_paid_current_month: checked },
      {
        onSuccess: () => {
          setIsUpdatingPaid(false)
          onToast?.(checked ? 'Despesa marcada como paga' : 'Despesa desmarcada como paga', 'success')
        },
        onError: (error: Error) => {
          setIsUpdatingPaid(false)
          setIsPaidCurrentMonth(!checked) // Reverte o estado
          onToast?.(error.message || 'Erro ao atualizar despesa', 'error')
        },
      }
    )
  }

  return (
    <div className={`p-5 bg-white rounded-card-lg border-2 ${expense.is_active ? 'border-border hover:border-primary-400 hover:shadow-lg' : 'border-neutral-200 opacity-60'} transition-all duration-fast relative`}>
      {/* Botões de ação no canto superior direito */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        {onEdit && (
          <button
            onClick={() => onEdit(expense)}
            className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Editar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors disabled:opacity-50"
            title="Excluir"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Header com nome e status */}
      <div className="flex items-start justify-between mb-4 pr-16">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-body font-semibold text-neutral-900 truncate">
              {expense.name}
            </h3>
            {expense.is_active && (
              <span className="px-2 py-0.5 bg-success-100 text-success-700 text-caption font-medium rounded-full flex-shrink-0">
                Ativo
              </span>
            )}
            {!expense.is_active && (
              <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-caption font-medium rounded-full flex-shrink-0">
                Inativo
              </span>
            )}
          </div>
          {category && (
            <div className="flex items-center gap-1.5 mb-1">
              {category.icon && (
                <span className="text-body-sm">{category.icon}</span>
              )}
              <span className="text-caption text-neutral-600">{category.name}</span>
            </div>
          )}
          {expense.description && (
            <p className="text-caption text-neutral-500 line-clamp-2">
              {expense.description}
            </p>
          )}
        </div>
        <div className="text-right ml-4 flex-shrink-0">
          <p className="text-h2 font-bold text-danger-600">
            R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-caption text-neutral-500">
            / mês
          </p>
        </div>
      </div>

      {/* Informações de vencimento */}
      <div className="grid grid-cols-2 gap-4 p-3 bg-neutral-50 rounded-lg mb-3">
        <div>
          <p className="text-caption text-neutral-500 mb-1">Vence dia</p>
          <p className="text-body font-semibold text-neutral-900">
            {expense.due_day}
          </p>
        </div>
        <div>
          <p className="text-caption text-neutral-500 mb-1">Próximo vencimento</p>
          <p className="text-body-sm font-semibold text-neutral-900">
            {nextDueDate.toLocaleDateString('pt-BR')}
          </p>
          {daysUntilDue >= 0 && (
            <p className="text-caption text-neutral-600 mt-0.5">
              {daysUntilDue === 0 ? 'Hoje' : daysUntilDue === 1 ? '1 dia' : `${daysUntilDue} dias`}
            </p>
          )}
        </div>
      </div>
      
      {/* Badge e Checkbox para marcar como paga */}
      {expense.is_active && onUpdate && (
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className={`px-2 py-1 text-caption font-semibold rounded-full border ${badgeColor}`}>
            {badgeText}
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isPaidCurrentMonth}
              onChange={(e) => handleTogglePaid(e.target.checked)}
              disabled={isUpdatingPaid}
              className="w-4 h-4 text-success-600 border-border rounded focus:ring-success-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-caption text-neutral-600">
              Paga
            </span>
          </label>
        </div>
      )}
    </div>
  )
}

