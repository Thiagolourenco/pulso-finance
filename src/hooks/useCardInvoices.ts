import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cardInvoiceService } from '@/services/cardInvoiceService'
import { getUser } from '@/lib/supabase/middleware'

export const useCardInvoices = (cardId?: string) => {
  const queryClient = useQueryClient()

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
  })

  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ['card_invoices', user?.id, cardId],
    queryFn: () => 
      cardId 
        ? cardInvoiceService.getByCard(cardId)
        : cardInvoiceService.getAll(user!.id),
    enabled: !!user?.id,
  })

  const getOpenInvoiceQuery = useQuery({
    queryKey: ['card_invoices', 'open', cardId],
    queryFn: () => cardInvoiceService.getOpenByCard(cardId!),
    enabled: !!user?.id && !!cardId,
  })

  const createMutation = useMutation({
    mutationFn: cardInvoiceService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card_invoices'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof cardInvoiceService.update>[1] }) =>
      cardInvoiceService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card_invoices'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: cardInvoiceService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card_invoices'] })
    },
  })

  return {
    invoices: invoices || [],
    openInvoice: getOpenInvoiceQuery.data || null,
    isLoading,
    error,
    createInvoice: createMutation.mutate,
    updateInvoice: updateMutation.mutate,
    deleteInvoice: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}


