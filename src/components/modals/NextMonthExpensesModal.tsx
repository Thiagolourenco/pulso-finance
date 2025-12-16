import { Modal } from '@/components/ui'
import type { Transaction, CardPurchase } from '@/types'

interface NextMonthExpensesModalProps {
  isOpen: boolean
  onClose: () => void
  nextMonthExpenses: number
  nextMonthFixedExpenses: number
  totalNextMonth: number
  fixedExpensesDetails: CardPurchase[]
  transactionsDetails: Transaction[]
  nextMonthName: string
}

export const NextMonthExpensesModal = ({
  isOpen,
  onClose,
  nextMonthExpenses,
  nextMonthFixedExpenses,
  totalNextMonth,
  fixedExpensesDetails,
  transactionsDetails,
  nextMonthName,
}: NextMonthExpensesModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Despesas de ${nextMonthName}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Resumo */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-lg border border-border">
            <p className="text-caption text-neutral-600 mb-1">Valor já gasto</p>
            <p className="text-body font-bold text-danger-600">
              R$ {nextMonthExpenses.toLocaleString('pt-BR', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-border">
            <p className="text-caption text-neutral-600 mb-1">Valores fixos</p>
            <p className="text-body font-bold text-warning-600">
              R$ {nextMonthFixedExpenses.toLocaleString('pt-BR', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </p>
          </div>
          <div className="p-4 bg-danger-50 rounded-lg border-2 border-danger-200">
            <p className="text-caption text-neutral-700 mb-1 font-medium">Total previsto</p>
            <p className="text-h3 font-bold text-danger-600">
              R$ {totalNextMonth.toLocaleString('pt-BR', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </p>
          </div>
        </div>

        {/* Despesas já registradas */}
        {transactionsDetails.length > 0 && (
          <div>
            <h3 className="text-body font-semibold text-neutral-900 mb-3">
              Despesas já registradas ({transactionsDetails.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transactionsDetails.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-3 bg-white rounded-lg border border-border flex items-center justify-between"
                >
                  <div>
                    <p className="text-body-sm font-medium text-neutral-900">
                      {transaction.description}
                    </p>
                    <p className="text-caption text-neutral-500">
                      {new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <p className="text-body font-semibold text-danger-600">
                    R$ {Math.abs(Number(transaction.amount)).toLocaleString('pt-BR', { 
                      minimumFractionDigits: 2 
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Despesas fixas (parcelas) */}
        {fixedExpensesDetails.length > 0 && (
          <div>
            <h3 className="text-body font-semibold text-neutral-900 mb-3">
              Despesas fixas - Parcelas ({fixedExpensesDetails.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {fixedExpensesDetails.map((purchase) => (
                <div
                  key={purchase.id}
                  className="p-3 bg-white rounded-lg border border-border flex items-center justify-between"
                >
                  <div>
                    <p className="text-body-sm font-medium text-neutral-900">
                      {purchase.description}
                    </p>
                    <p className="text-caption text-neutral-500">
                      Parcela {purchase.current_installment}/{purchase.installments} • 
                      Comprado em {new Date(purchase.purchase_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <p className="text-body font-semibold text-warning-600">
                    R$ {purchase.installment_amount.toLocaleString('pt-BR', { 
                      minimumFractionDigits: 2 
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {transactionsDetails.length === 0 && fixedExpensesDetails.length === 0 && (
          <div className="p-8 text-center bg-neutral-50 rounded-lg border border-border">
            <p className="text-body-sm text-neutral-500">
              Nenhuma despesa prevista para o próximo mês
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}


