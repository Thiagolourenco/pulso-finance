import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryService } from '@/services/categoryService'
import { getUser } from '@/lib/supabase/middleware'

export const useCategories = () => {
  const queryClient = useQueryClient()

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
  })

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories', user?.id],
    queryFn: () => categoryService.getAll(user!.id),
    enabled: !!user?.id,
  })

  const createMutation = useMutation({
    mutationFn: categoryService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof categoryService.update>[1] }) =>
      categoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: categoryService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  // Wrapper para aceitar callbacks
  const createCategory = (
    data: Parameters<typeof categoryService.create>[0],
    callbacks?: { onSuccess?: () => void; onError?: (error: Error) => void }
  ) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['categories'] })
        callbacks?.onSuccess?.()
      },
      onError: (error: Error) => {
        callbacks?.onError?.(error)
      },
    })
  }

  return {
    categories: categories || [],
    isLoading,
    error,
    createCategory,
    updateCategory: updateMutation.mutate,
    deleteCategory: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

