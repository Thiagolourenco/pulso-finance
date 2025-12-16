import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cardPurchaseService } from '@/services/cardPurchaseService'
import { getUser } from '@/lib/supabase/middleware'

export const useCardPurchases = (cardId?: string) => {
  const queryClient = useQueryClient()

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
  })

  const { data: purchases, isLoading, error } = useQuery({
    queryKey: ['card_purchases', user?.id, cardId],
    queryFn: () => 
      cardId 
        ? cardPurchaseService.getByCard(cardId)
        : cardPurchaseService.getAll(user!.id),
    enabled: !!user?.id,
  })

  const createMutation = useMutation({
    mutationFn: cardPurchaseService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card_purchases'] })
      queryClient.invalidateQueries({ queryKey: ['card_invoices'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof cardPurchaseService.update>[1] }) =>
      cardPurchaseService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card_purchases'] })
      queryClient.invalidateQueries({ queryKey: ['card_invoices'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: cardPurchaseService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card_purchases'] })
      queryClient.invalidateQueries({ queryKey: ['card_invoices'] })
    },
  })

  return {
    purchases: purchases || [],
    isLoading,
    error,
    createPurchase: createMutation.mutate,
    updatePurchase: updateMutation.mutate,
    deletePurchase: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}


