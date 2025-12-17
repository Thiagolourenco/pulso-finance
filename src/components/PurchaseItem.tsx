import { useState, useEffect } from 'react'
import type { CardPurchase } from '@/types'

interface PurchaseItemProps {
  purchase: CardPurchase
  onUpdate: (id: string, data: { current_installment?: number; is_recurring?: boolean }, callbacks?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
  onToast: (message: string, type: 'success' | 'error') => void
}

export const PurchaseItem = ({ purchase, onUpdate, onToast }: PurchaseItemProps) => {
  const [isUpdatingInstallment, setIsUpdatingInstallment] = useState(false)
  const [localInstallment, setLocalInstallment] = useState(purchase.current_installment)
  const [isRecurring, setIsRecurring] = useState(purchase.is_recurring || false)
  const [isUpdatingRecurring, setIsUpdatingRecurring] = useState(false)

  // Sincroniza o valor local quando a compra é atualizada
  useEffect(() => {
    setTimeout(() => {
      setLocalInstallment(purchase.current_installment)
      setIsRecurring(purchase.is_recurring || false)
    }, 0)
  }, [purchase.current_installment, purchase.is_recurring])

  const paidInstallments = purchase.current_installment - 1
  const remainingInstallments = purchase.installments - purchase.current_installment + 1
  const progressPercentage = ((purchase.current_installment - 1) / purchase.installments) * 100

  const handleUpdateInstallment = (newInstallment: number) => {
    if (newInstallment < 1 || newInstallment > purchase.installments) {
      onToast('Número de parcela inválido', 'error')
      setLocalInstallment(purchase.current_installment)
      return
    }

    setIsUpdatingInstallment(true)
    onUpdate(
      purchase.id, 
      { current_installment: newInstallment },
      {
        onSuccess: () => {
          setIsUpdatingInstallment(false)
          onToast(`Parcela atualizada para ${newInstallment}/${purchase.installments}`, 'success')
        },
        onError: (error: Error) => {
          setIsUpdatingInstallment(false)
          setLocalInstallment(purchase.current_installment)
          onToast(error.message || 'Erro ao atualizar parcela', 'error')
        },
      }
    )
  }

  const handleToggleRecurring = (checked: boolean) => {
    setIsRecurring(checked)
    setIsUpdatingRecurring(true)
    onUpdate(
      purchase.id,
      { is_recurring: checked },
      {
        onSuccess: () => {
          setIsUpdatingRecurring(false)
          onToast(checked ? 'Compra marcada como recorrente' : 'Compra desmarcada como recorrente', 'success')
        },
        onError: (error: Error) => {
          setIsUpdatingRecurring(false)
          setIsRecurring(!checked) // Reverte o estado
          onToast(error.message || 'Erro ao atualizar compra', 'error')
        },
      }
    )
  }

  return (
    <div className="p-3 bg-white rounded-lg border border-border hover:border-primary-300 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-body-sm font-medium text-neutral-900">
              {purchase.description}
            </p>
            {isRecurring && (
              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-caption font-medium rounded-full">
                🔄 Recorrente
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-caption text-neutral-500">
              {purchase.current_installment}/{purchase.installments}x • 
              Comprado em {new Date(purchase.purchase_date).toLocaleDateString('pt-BR')}
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => handleToggleRecurring(e.target.checked)}
                disabled={isUpdatingRecurring}
                className="w-4 h-4 text-primary-600 border-border rounded focus:ring-primary-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-caption text-neutral-600">
                Recorrente
              </span>
            </label>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 bg-neutral-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary-500 h-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-caption text-neutral-600 font-medium">
              {paidInstallments} paga{paidInstallments !== 1 ? 's' : ''} • {remainingInstallments} restante{remainingInstallments !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <button
              onClick={() => {
                if (localInstallment > 1) {
                  const newValue = localInstallment - 1
                  setLocalInstallment(newValue)
                  handleUpdateInstallment(newValue)
                }
              }}
              disabled={isUpdatingInstallment || localInstallment <= 1}
              className="w-6 h-6 rounded border border-border bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-caption text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              −
            </button>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-neutral-50 rounded border border-border">
              <input
                type="number"
                min="1"
                max={purchase.installments}
                value={localInstallment}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  if (!isNaN(value) && value >= 1 && value <= purchase.installments) {
                    setLocalInstallment(value)
                  }
                }}
                onBlur={() => {
                  if (localInstallment !== purchase.current_installment && localInstallment >= 1 && localInstallment <= purchase.installments) {
                    handleUpdateInstallment(localInstallment)
                  } else {
                    setLocalInstallment(purchase.current_installment)
                  }
                }}
                className="w-8 text-center text-caption font-medium text-neutral-900 bg-transparent border-0 focus:outline-none focus:ring-0 p-0"
                disabled={isUpdatingInstallment}
              />
              <span className="text-caption text-neutral-400">/</span>
              <span className="text-caption text-neutral-500 font-medium">{purchase.installments}</span>
            </div>
            <button
              onClick={() => {
                if (localInstallment < purchase.installments) {
                  const newValue = localInstallment + 1
                  setLocalInstallment(newValue)
                  handleUpdateInstallment(newValue)
                }
              }}
              disabled={isUpdatingInstallment || localInstallment >= purchase.installments}
              className="w-6 h-6 rounded border border-border bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-caption text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              +
            </button>
          </div>
        </div>
        <div className="text-right ml-4">
          <p className="text-body font-semibold text-neutral-900">
            R$ {purchase.installment_amount.toLocaleString('pt-BR', { 
              minimumFractionDigits: 2 
            })}
          </p>
          <p className="text-caption text-neutral-500">
            Total: R$ {purchase.total_amount.toLocaleString('pt-BR', { 
              minimumFractionDigits: 2 
            })}
          </p>
        </div>
      </div>
    </div>
  )
}

