import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cardService } from '@/services/cardService'
import { getUser } from '@/lib/supabase/middleware'

export const useCards = () => {
  const queryClient = useQueryClient()

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
  })

  const { data: cards, isLoading, error } = useQuery({
    queryKey: ['cards', user?.id],
    queryFn: () => cardService.getAll(user!.id),
    enabled: !!user?.id,
  })

  const createMutation = useMutation({
    mutationFn: cardService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof cardService.update>[1] }) =>
      cardService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: cardService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] })
    },
  })

  return {
    cards: cards || [],
    isLoading,
    error,
    createCard: createMutation.mutate,
    updateCard: updateMutation.mutate,
    deleteCard: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}








