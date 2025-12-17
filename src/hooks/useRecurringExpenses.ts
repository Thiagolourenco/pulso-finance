import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recurringExpenseService } from '@/services/recurringExpenseService'
import { getUser } from '@/lib/supabase/middleware'

export const useRecurringExpenses = () => {
  const queryClient = useQueryClient()

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
  })

  const { data: expenses, isLoading, error } = useQuery({
    queryKey: ['recurring_expenses', user?.id],
    queryFn: () => recurringExpenseService.getAll(user!.id),
    enabled: !!user?.id,
  })

  const createMutation = useMutation({
    mutationFn: recurringExpenseService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_expenses'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof recurringExpenseService.update>[1] }) =>
      recurringExpenseService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_expenses'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: recurringExpenseService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_expenses'] })
    },
  })

  return {
    expenses: expenses || [],
    isLoading,
    error,
    createExpense: createMutation.mutate,
    updateExpense: updateMutation.mutate,
    deleteExpense: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}




