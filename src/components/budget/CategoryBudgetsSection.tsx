import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, Modal, Toast } from '@/components/ui'
import { CategoryBudgetCard } from './CategoryBudgetCard'
import { EditCategoryLimitForm } from '@/components/forms/EditCategoryLimitForm'
import { useCategories } from '@/hooks/useCategories'
import type { Category, Transaction, CardPurchase, CardInvoice, RecurringExpense } from '@/types'
import { supabase } from '@/lib/supabase/client'
import { categoryPreferencesService } from '@/services/categoryPreferencesService'

interface CategoryBudget {
  category: Category
  limit: number
  spent: number
  percentage: number
}

interface CategoryBudgetsSectionProps {
  categories: Category[]
  transactions: Transaction[]
  cardPurchases: CardPurchase[]
  invoices: CardInvoice[]
  recurringExpenses: RecurringExpense[]
}

export const CategoryBudgetsSection = ({
  categories,
  transactions,
  cardPurchases,
  invoices: _invoices,
  recurringExpenses,
}: CategoryBudgetsSectionProps) => {
  const [showAll, setShowAll] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [showSelector, setShowSelector] = useState(false)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [showOnlyCritical, setShowOnlyCritical] = useState<boolean>(false)
  const [userId, setUserId] = useState<string | null>(null)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { updateCategory, isUpdating } = useCategories()

  // Referência vazia para marcar o prop como usado (mantemos para futura lógica)
  useEffect(() => {
    // noop: invoices ainda não são usados no cálculo atual
  }, [_invoices])

  // Captura userId
  useEffect(() => {
    let isMounted = true
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!isMounted) return
      setUserId(data.user?.id ?? null)
    }
    fetchUser()
    return () => {
      isMounted = false
    }
  }, [])

  // Carrega preferências (Supabase -> fallback localStorage)
  useEffect(() => {
    let isMounted = true
    const loadPrefs = async () => {
      if (userId) {
        const prefs = await categoryPreferencesService.get(userId)
        if (prefs && isMounted) {
          setSelectedCategoryIds(prefs.selected_category_ids || [])
          setShowOnlyCritical(!!prefs.show_only_critical)
          return
        }
      }
      // fallback local
      try {
        const stored = localStorage.getItem('budget_selected_categories')
        const storedCritical = localStorage.getItem('budget_show_only_critical')
        if (isMounted) {
          setSelectedCategoryIds(stored ? JSON.parse(stored) : [])
          setShowOnlyCritical(storedCritical ? storedCritical === 'true' : false)
        }
      } catch {
        // ignora
      }
    }
    loadPrefs()
    return () => {
      isMounted = false
    }
  }, [userId])

  // Salva preferências (Supabase + localStorage) com debounce
  useEffect(() => {
    // sempre salva local
    try {
      localStorage.setItem('budget_selected_categories', JSON.stringify(selectedCategoryIds))
      localStorage.setItem('budget_show_only_critical', showOnlyCritical ? 'true' : 'false')
    } catch {
      // ignora
    }

    if (!userId) return
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      try {
        await categoryPreferencesService.upsert(userId, {
          selected_category_ids: selectedCategoryIds,
          show_only_critical: showOnlyCritical,
        })
      } catch (err) {
        console.error('Erro ao salvar preferências:', err)
      }
    }, 400)

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
    }
  }, [selectedCategoryIds, showOnlyCritical, userId])

  // Obtém o mês atual
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  // Calcula gastos por categoria no mês atual
  const calculateCategorySpending = useCallback((categoryId: string): number => {
    let total = 0

    // Transações diretas
    const categoryTransactions = transactions.filter(t => {
      if (t.category_id !== categoryId || t.type !== 'expense') return false
      const transactionDate = new Date(t.date)
      return (
        transactionDate.getMonth() + 1 === currentMonth &&
        transactionDate.getFullYear() === currentYear
      )
    })
    total += categoryTransactions.reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0)

    // Compras no cartão (parcelas do mês atual)
    const categoryPurchases = cardPurchases.filter(p => {
      if (p.category_id !== categoryId) return false
      
      const purchaseDate = new Date(p.purchase_date)
      const purchaseMonth = purchaseDate.getMonth() + 1
      const purchaseYear = purchaseDate.getFullYear()
      
      // Calcula qual parcela será paga no mês atual
      const monthsDiff = (currentYear - purchaseYear) * 12 + (currentMonth - purchaseMonth)
      const installmentToPay = monthsDiff + 1
      
      return (
        monthsDiff >= 0 &&
        installmentToPay >= p.current_installment &&
        installmentToPay <= p.installments
      )
    })
    total += categoryPurchases.reduce((sum, p) => sum + (p.installment_amount || 0), 0)

    // Despesas recorrentes ativas que vencem no mês atual
    const categoryRecurring = recurringExpenses.filter(expense => {
      if (!expense.is_active || expense.category_id !== categoryId) return false
      const dueDate = new Date(currentYear, currentMonth - 1, expense.due_day)
      return dueDate.getMonth() + 1 === currentMonth && dueDate.getFullYear() === currentYear
    })
    total += categoryRecurring.reduce((sum, e) => sum + (e.amount || 0), 0)

    return total
  }, [cardPurchases, currentMonth, currentYear, recurringExpenses, transactions])

  // Filtra apenas categorias de despesa que têm limite definido OU gastos no mês
  const expenseCategories = categories.filter(c => c.type === 'expense')
  
  const budgets: CategoryBudget[] = useMemo(() => {
    return expenseCategories
      .map(category => {
        const spent = calculateCategorySpending(category.id)
        // Usa o limite real da categoria, ou calcula um padrão se não tiver limite
        const limitFromCategory = category.monthly_limit ?? 0
        const hasLimit = limitFromCategory > 0
        
        let limit: number
        if (hasLimit) {
          limit = limitFromCategory
        } else {
          // Se não tem limite definido, calcula um padrão baseado no total de gastos
          // Mas só mostra se houver gastos significativos
          const totalMonthlyExpenses = transactions
            .filter(t => {
              const tDate = new Date(t.date)
              return t.type === 'expense' && 
                     tDate.getMonth() + 1 === currentMonth && 
                     tDate.getFullYear() === currentYear
            })
            .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0)
          
          limit = Math.max(totalMonthlyExpenses * 0.1, 500)
        }
        
        const percentage = limit > 0 ? (spent / limit) * 100 : 0

        return {
          category,
          limit,
          spent,
          percentage,
        }
      })
      .filter(budget => {
        // Mostra apenas categorias que:
        // 1. Têm limite definido (mesmo sem gastos), OU
        // 2. Têm gastos no mês atual
        const hasLimit = budget.category.monthly_limit !== null && budget.category.monthly_limit > 0
        return hasLimit || budget.spent > 0
      })
      .sort((a, b) => {
        // Ordena por: 1) Estourado, 2) Próximo do limite, 3) Maior gasto
        if (a.spent > a.limit && b.spent <= b.limit) return -1
        if (a.spent <= a.limit && b.spent > b.limit) return 1
        if (a.percentage >= 80 && b.percentage < 80) return -1
        if (a.percentage < 80 && b.percentage >= 80) return 1
        return b.spent - a.spent
      })
  }, [expenseCategories, calculateCategorySpending, currentMonth, currentYear, transactions])

  // Aplica filtros de seleção e crítico
  const filteredBudgets = useMemo(() => {
    return budgets.filter(b => {
      const passesSelection = selectedCategoryIds.length === 0 || selectedCategoryIds.includes(b.category.id)
      const passesCritical = !showOnlyCritical || b.percentage >= 80
      return passesSelection && passesCritical
    })
  }, [budgets, selectedCategoryIds, showOnlyCritical])

  if (budgets.length === 0) {
    return null
  }

  const displayedBudgets = showAll ? filteredBudgets : filteredBudgets.slice(0, 6)
  const hasMore = filteredBudgets.length > 6

  const handleEditLimit = (category: Category) => {
    setEditingCategory(category)
  }

  const handleCloseModal = () => {
    setEditingCategory(null)
  }

  const handleSaveLimit = async (limit: number | null) => {
    if (!editingCategory) return

    updateCategory(
      {
        id: editingCategory.id,
        data: { monthly_limit: limit },
      },
      {
        onSuccess: () => {
          setToast({ 
            message: limit === null 
              ? 'Limite removido com sucesso!' 
              : 'Limite atualizado com sucesso!', 
            type: 'success' 
          })
          handleCloseModal()
        },
        onError: (error: Error) => {
          setToast({ 
            message: error.message || 'Erro ao atualizar limite', 
            type: 'error' 
          })
        },
      }
    )
  }

  return (
    <div className="mb-8 mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-h3 font-semibold text-neutral-900 dark:text-neutral-50">
            Orçamento por Categoria
          </h2>
          <p className="text-body-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Acompanhe seus gastos e limites mensais por categoria
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowSelector(!showSelector)}
          >
            Selecionar categorias
          </Button>
          <label className="flex items-center gap-2 text-body-sm text-neutral-600 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={showOnlyCritical}
              onChange={(e) => setShowOnlyCritical(e.target.checked)}
            />
            Mostrar só críticas (≥ 80%)
          </label>
          {hasMore && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Ver menos' : `Ver todas (${filteredBudgets.length})`}
            </Button>
          )}
        </div>
      </div>

      {/* Seletor de categorias */}
      {showSelector && (
        <div className="mb-4 p-3 rounded-lg border border-border dark:border-border-dark bg-neutral-50 dark:bg-neutral-900/40">
          <div className="flex items-center justify-between mb-2">
            <p className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50">
              Escolha quais categorias exibir
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategoryIds([])}
            >
              Limpar seleção
            </Button>
          </div>
          <div className="max-h-48 overflow-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1">
            {expenseCategories.map(cat => {
              const checked = selectedCategoryIds.includes(cat.id)
              return (
                <label
                  key={cat.id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/70 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategoryIds(prev => [...prev, cat.id])
                      } else {
                        setSelectedCategoryIds(prev => prev.filter(id => id !== cat.id))
                      }
                    }}
                  />
                  <span className="text-body-sm text-neutral-800 dark:text-neutral-100">
                    {cat.icon && <span className="mr-1">{cat.icon}</span>}
                    {cat.name}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedBudgets.map((budget) => (
          <CategoryBudgetCard 
            key={budget.category.id} 
            budget={budget} 
            onEditLimit={handleEditLimit}
          />
        ))}
      </div>

      {/* Modal de Editar Limite */}
      {editingCategory && (
        <Modal
          isOpen={!!editingCategory}
          onClose={handleCloseModal}
          title="Editar Limite Mensal"
          size="md"
        >
          <EditCategoryLimitForm
            category={editingCategory}
            onSubmit={handleSaveLimit}
            onCancel={handleCloseModal}
            isLoading={isUpdating}
          />
        </Modal>
      )}

      {/* Toast de notificação */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />
      )}

      {budgets.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-body-sm text-neutral-500 dark:text-neutral-300 mb-4">
            Nenhum orçamento configurado ainda. Defina limites por categoria no onboarding ou nas configurações.
          </p>
        </Card>
      )}
    </div>
  )
}

