import { useState, useEffect, useRef } from 'react'
import { FinancialCard, Button, Modal, Toast } from '@/components/ui'
import { AddTransactionForm } from '@/components/forms/AddTransactionForm'
import { AddAccountForm } from '@/components/forms/AddAccountForm'
import { AddCardForm } from '@/components/forms/AddCardForm'
import { AddCardPurchaseForm } from '@/components/forms/AddCardPurchaseForm'
import { CardDetailsModal } from '@/components/modals/CardDetailsModal'
import { NextMonthExpensesModal } from '@/components/modals/NextMonthExpensesModal'
import { MonthlyExpensesModal } from '@/components/modals/MonthlyExpensesModal'
import { AddGoalForm } from '@/components/forms/AddGoalForm'
import { AddCategoryForm } from '@/components/forms/AddCategoryForm'
import { AddRecurringExpenseForm } from '@/components/forms/AddRecurringExpenseForm'
import { GoalCard } from '@/components/goals/GoalCard'
import { RecurringExpenseCard } from '@/components/recurring/RecurringExpenseCard'
import { InsightsCard } from '@/components/insights/InsightsCard'
import { CategoryBudgetsSection } from '@/components/budget/CategoryBudgetsSection'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useTransactions } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import { useCards } from '@/hooks/useCards'
import { useCardPurchases } from '@/hooks/useCardPurchases'
import { useCardInvoices } from '@/hooks/useCardInvoices'
import { useCategories } from '@/hooks/useCategories'
import { useGoals } from '@/hooks/useGoals'
import { useRecurringExpenses } from '@/hooks/useRecurringExpenses'
import { supabase } from '@/lib/supabase/client'
import { getOrCreateDefaultCategory, getOrCreateBalanceCategory } from '@/lib/utils/categories'
import { parseLocalDate } from '@/lib/utils'
import { getReportsMonthSummary } from '@/lib/utils/reportsMonthSummary'

type ModalType = 'transaction' | 'account' | 'card' | 'cardPurchase' | 'goal' | 'category' | 'recurringExpense' | 'totalMoney' | null
type TransactionType = 'expense' | 'income' | 'balance'

export const Dashboard = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [modalType, setModalType] = useState<ModalType>(null)
  const [transactionType, setTransactionType] = useState<TransactionType>('expense')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const { transactions, createTransaction, isCreating } = useTransactions()
  const { accounts, createAccount, isCreating: isCreatingAccount } = useAccounts()
  const { cards, createCard, isCreating: isCreatingCard } = useCards()
  const { purchases, createPurchase, isCreating: isCreatingPurchase } = useCardPurchases()
  const { invoices, updateInvoice, createInvoice, isUpdating: isUpdatingInvoice } = useCardInvoices()
  const { categories, createCategory, isCreating: isCreatingCategory } = useCategories()
  
  // Notificações de faturas vencidas ou no dia do vencimento
  useEffect(() => {
    const checkInvoiceNotifications = () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Faturas atrasadas
      const overdueInvoices = invoices.filter(invoice => {
        if (invoice.status !== 'open') return false
        
        const dueDate = new Date(invoice.due_date)
        dueDate.setHours(0, 0, 0, 0)
        
        return dueDate < today && invoice.total_amount > 0
      })
      
      // Faturas que vencem hoje
      const dueTodayInvoices = invoices.filter(invoice => {
        if (invoice.status !== 'open') return false
        
        const dueDate = new Date(invoice.due_date)
        dueDate.setHours(0, 0, 0, 0)
        
        return dueDate.getTime() === today.getTime() && invoice.total_amount > 0
      })
      
      if (overdueInvoices.length > 0) {
        const cardNames = overdueInvoices.map(inv => {
          const card = cards.find(c => c.id === inv.card_id)
          return card?.name || 'Cartão'
        }).join(', ')
        
        setToast({
          message: `⚠️ Você tem ${overdueInvoices.length} fatura(s) atrasada(s): ${cardNames}`,
          type: 'error'
        })
      } else if (dueTodayInvoices.length > 0) {
        const cardNames = dueTodayInvoices.map(inv => {
          const card = cards.find(c => c.id === inv.card_id)
          return card?.name || 'Cartão'
        }).join(', ')
        
        setToast({
          message: `📅 Fatura(s) vence(m) hoje: ${cardNames}. Não esqueça de pagar!`,
          type: 'info'
        })
      }
    }
    
    // Verifica ao carregar e a cada hora
    checkInvoiceNotifications()
    const interval = setInterval(checkInvoiceNotifications, 3600000) // A cada 1 hora
    
    return () => clearInterval(interval)
  }, [invoices, cards])
  const { goals, createGoal, isCreating: isCreatingGoal } = useGoals()
  const { expenses: recurringExpenses, createExpense, updateExpense, deleteExpense, isCreating: isCreatingRecurringExpense, isUpdating: isUpdatingRecurringExpense } = useRecurringExpenses()

  const [selectedCardId, setSelectedCardId] = useState<string | undefined>(undefined)
  const [selectedCardForModal, setSelectedCardForModal] = useState<string | null>(null)
  const [showNextMonthDetails, setShowNextMonthDetails] = useState(false)
  const [showMonthlyExpenses, setShowMonthlyExpenses] = useState(false)
  const [editingRecurringExpense, setEditingRecurringExpense] = useState<any>(null)
  const [showAllCards, setShowAllCards] = useState(false) // Para mobile: controla se mostra todos os cards
  const [showTotalMoneyModal, setShowTotalMoneyModal] = useState(false) // Controla modal do resumo do total do dinheiro

  // Obtém o mês atual e anterior
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()
  
  // Mês anterior
  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1
  const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear

  // Garante que cada cartão tenha uma fatura do ciclo atual (vencimento no mês atual ou futuro), para ao virar o mês mostrar "A PAGAR" em vez de "Nenhuma fatura aberta"
  useEffect(() => {
    if (!cards?.length || !invoices) return
    const startOfCurrentMonth = new Date(currentYear, currentMonth - 1, 1)
    startOfCurrentMonth.setHours(0, 0, 0, 0)

    const getCurrentCycleDates = (card: { closing_day: number; due_day: number }) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const refM = today.getMonth()
      const refY = today.getFullYear()
      const closingDate = new Date(refY, refM, card.closing_day)
      const invoiceMonth = today.getDate() <= card.closing_day
        ? new Date(refY, refM, 1)
        : new Date(refY, refM + 1, 1)
      let dueDate = new Date(refY, refM, card.due_day)
      if (dueDate <= closingDate) dueDate.setMonth(dueDate.getMonth() + 1)
      if (dueDate < today) {
        dueDate.setMonth(dueDate.getMonth() + 1)
        if (invoiceMonth.getMonth() === refM && invoiceMonth.getFullYear() === refY) {
          invoiceMonth.setMonth(invoiceMonth.getMonth() + 1)
        }
      }
      return {
        reference_month: invoiceMonth.toISOString().split('T')[0],
        closing_date: closingDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
      }
    }

    void (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      for (const card of cards) {
        const cardInvoices = invoices.filter((inv: { card_id: string }) => inv.card_id === card.id)
        const hasCurrentCycle = cardInvoices.some((inv: { due_date: string }) => {
          const due = new Date(inv.due_date)
          due.setHours(0, 0, 0, 0)
          return due >= startOfCurrentMonth
        })
        if (!hasCurrentCycle) {
          const dates = getCurrentCycleDates(card)
          createInvoice(
            {
              user_id: user.id,
              card_id: card.id,
              reference_month: dates.reference_month,
              closing_date: dates.closing_date,
              due_date: dates.due_date,
              status: 'open',
              total_amount: 0,
            },
            {
              onSuccess: () => queryClient.invalidateQueries({ queryKey: ['card_invoices'] }),
              onError: () => {}, // Pode falhar se já existir (ex.: outra aba criou)
            }
          )
        }
      }
    })()
  }, [cards, invoices, currentMonth, currentYear, createInvoice, queryClient])

  // Receitas / despesas / saldo do fluxo: mesma regra da página Relatórios (Mês)
  const reportCurrentMonth = getReportsMonthSummary(transactions, invoices, recurringExpenses, currentYear, currentMonth)
  const reportPreviousMonth = getReportsMonthSummary(transactions, invoices, recurringExpenses, previousYear, previousMonth)

  const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`

  const monthlyIncome = reportCurrentMonth.totalIncome
  const previousMonthIncome = reportPreviousMonth.totalIncome
  const previousMonthExpenses = reportPreviousMonth.totalExpenses

  // Despesas do card do Dashboard: apenas o que foi efetivamente pago no mês.
  const monthlyTransactionExpensesPaid = transactions
    .filter(transaction => {
      const transactionDate = parseLocalDate(transaction.date)
      return (
        transaction.type === 'expense' &&
        transactionDate.getMonth() + 1 === currentMonth &&
        transactionDate.getFullYear() === currentYear
      )
    })
    .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount) || 0), 0)

  const monthlyInvoicesPaid = invoices
    .filter(invoice => invoice.status === 'paid' && invoice.last_paid_reference_month === currentMonthStr)
    .reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0)

  const monthlyRecurringPaid = recurringExpenses
    .filter(expense => expense.is_active && expense.last_paid_reference_month === currentMonthStr)
    .reduce((sum, expense) => sum + (expense.amount || 0), 0)

  const monthlyExpenses = monthlyTransactionExpensesPaid + monthlyInvoicesPaid + monthlyRecurringPaid
  const monthlyFlowBalance = monthlyIncome - monthlyExpenses

  // Para o MODAL de despesas: faturas que vencem no mês ou pagas no mês; recorrentes com vencimento no mês
  const currentMonthInvoicesForDisplay = invoices.filter(invoice => {
    const invoiceDueDate = new Date(invoice.due_date)
    const dueThisMonth = invoiceDueDate.getMonth() + 1 === currentMonth && invoiceDueDate.getFullYear() === currentYear
    const paidThisMonth = invoice.status === 'paid' && invoice.last_paid_reference_month === currentMonthStr
    return dueThisMonth || paidThisMonth
  })

  const currentMonthRecurringExpensesList = recurringExpenses.filter(expense => {
    if (!expense.is_active) return false
    const dueDate = new Date(currentYear, currentMonth - 1, expense.due_day)
    return dueDate.getMonth() + 1 === currentMonth && dueDate.getFullYear() === currentYear
  })

  // Calcula o total de investimentos (contas tipo investment)
  const investmentAccounts = accounts.filter(account => account.type === 'investment')
  const totalInvestments = investmentAccounts.reduce((sum, account) => {
    const balance = Number(account.current_balance) || 0
    return sum + balance
  }, 0)

  // Calcula sobra prevista (receitas - despesas do mês atual)
  const incomeForSurplusCalculation = monthlyIncome > 0 ? monthlyIncome : previousMonthIncome
  const expectedSurplus = incomeForSurplusCalculation - monthlyExpenses
  
  // Sobra do mês anterior (saldo do fluxo, igual Relatórios)
  const previousMonthSurplus = reportPreviousMonth.totalBalance

  // Soma dos saldos de todas as contas
  const sumOfAccounts = accounts.reduce((sum, account) => {
    const balance = Number(account.current_balance) || 0
    return sum + balance
  }, 0)

  const totalRealWealth = sumOfAccounts

  // Migração automática: receitas sem conta (mês anterior + atual) viram conta "Banco Inter - Salario".
  // Isso evita receitas "perdidas" e faz o patrimônio refletir o total em conta.
  const isInitialBalanceEntry = (description?: string | null) =>
    (description || '').toLowerCase().startsWith('saldo inicial:')
  const isAutoLinkingIncomeRef = useRef(false)
  const autoLinkedTransactionIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const interAccount = accounts.find(a => a.name.trim().toLowerCase() === 'banco inter - salario')
    if (!interAccount || isAutoLinkingIncomeRef.current) return

    const windowStart = new Date(currentYear, currentMonth - 2, 1)
    windowStart.setHours(0, 0, 0, 0)

    const candidates = transactions.filter(t => {
      if (t.type !== 'income' || t.account_id || isInitialBalanceEntry(t.description)) return false
      const d = parseLocalDate(t.date)
      if (Number.isNaN(d.getTime())) return false
      d.setHours(0, 0, 0, 0)
      return d >= windowStart && !autoLinkedTransactionIdsRef.current.has(t.id)
    })
    if (candidates.length === 0) return

    const candidateIds = candidates.map(t => t.id)
    candidateIds.forEach(id => autoLinkedTransactionIdsRef.current.add(id))
    isAutoLinkingIncomeRef.current = true

    void (async () => {
      try {
        const totalToAdd = candidates.reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0)
        const { error: txError } = await supabase
          .from('transactions')
          .update({ account_id: interAccount.id })
          .in('id', candidateIds)
        if (txError) throw txError

        const { error: accError } = await supabase
          .from('accounts')
          .update({
            current_balance: (Number(interAccount.current_balance) || 0) + totalToAdd,
            updated_at: new Date().toISOString(),
          })
          .eq('id', interAccount.id)
        if (accError) throw accError

        setToast({
          message: `${candidates.length} receita(s) sem conta foram vinculadas automaticamente a "Banco Inter - Salario".`,
          type: 'success',
        })
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['accounts'] })
      } catch (error) {
        candidateIds.forEach(id => autoLinkedTransactionIdsRef.current.delete(id))
        console.error('Erro ao vincular receitas sem conta para Banco Inter - Salario:', error)
      } finally {
        isAutoLinkingIncomeRef.current = false
      }
    })()
  }, [accounts, transactions, currentMonth, currentYear, queryClient])

  // Total da fatura por ciclo (mês/ano alvo), baseado nas parcelas realmente devidas
  const calculateCardInvoiceTotalForMonth = (cardId: string, targetMonth: number, targetYear: number) => {
    const cardPurchases = purchases.filter(purchase => purchase.card_id === cardId)

    return cardPurchases
      .filter(purchase => {
        if (purchase.current_installment > purchase.installments) return false

        const purchaseDate = new Date(purchase.purchase_date)
        const purchaseMonth = purchaseDate.getMonth() + 1
        const purchaseYear = purchaseDate.getFullYear()

        // Se compra foi no mês M, a parcela 1 vence em M+1.
        const monthsDiff = (targetYear - purchaseYear) * 12 + (targetMonth - purchaseMonth)
        const installmentDueInTargetMonth = monthsDiff

        return (
          monthsDiff >= 1 &&
          installmentDueInTargetMonth >= purchase.current_installment &&
          installmentDueInTargetMonth <= purchase.installments
        )
      })
      .reduce((sum, purchase) => sum + (purchase.installment_amount || 0), 0)
  }

  const getPurchasesDueForInvoiceMonth = (cardId: string, targetMonth: number, targetYear: number) => {
    return purchases.filter(purchase => {
      if (purchase.card_id !== cardId) return false
      if (purchase.current_installment > purchase.installments) return false

      const purchaseDate = new Date(purchase.purchase_date)
      const purchaseMonth = purchaseDate.getMonth() + 1
      const purchaseYear = purchaseDate.getFullYear()
      const monthsDiff = (targetYear - purchaseYear) * 12 + (targetMonth - purchaseMonth)
      const installmentDueInTargetMonth = monthsDiff

      return (
        monthsDiff >= 1 &&
        installmentDueInTargetMonth >= purchase.current_installment &&
        installmentDueInTargetMonth <= purchase.installments
      )
    })
  }

  const advanceInstallmentsAfterInvoicePayment = async (cardId: string, targetMonth: number, targetYear: number) => {
    const purchasesDue = getPurchasesDueForInvoiceMonth(cardId, targetMonth, targetYear)
    if (purchasesDue.length === 0) return

    await Promise.all(
      purchasesDue.map(async (purchase) => {
        const updateData: Record<string, unknown> = {}

        if (purchase.is_recurring) {
          // Compra recorrente: reinicia ciclo para continuar cobrando no mês seguinte.
          updateData.current_installment = 1
          updateData.purchase_date = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`
        } else {
          // Compra parcelada comum: avança para próxima parcela (pode passar de installments ao finalizar).
          updateData.current_installment = purchase.current_installment + 1
        }

        const { error } = await supabase
          .from('card_purchases')
          .update(updateData)
          .eq('id', purchase.id)

        if (error) throw error
      })
    )
  }

  // Patrimônio em contas (snapshot) — diferente do saldo do fluxo mensal
  const liquidAccountTypes = new Set(['bank', 'cash', 'wallet'])
  const liquidAccountsBalance = accounts
    .filter(account => liquidAccountTypes.has(account.type))
    .reduce((sum, account) => sum + (Number(account.current_balance) || 0), 0)
  // Calcula variação percentual da sobra
  const surplusVariation = previousMonthSurplus !== 0
    ? ((expectedSurplus - previousMonthSurplus) / Math.abs(previousMonthSurplus)) * 100
    : 0


  const handleAddTransaction = async (data: {
    description: string
    amount: number
    type: 'expense' | 'income' | 'balance'
    date: string
    category_id?: string
    account_id?: string | null
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setToast({ message: 'Você precisa estar logado', type: 'error' })
        return
      }

      // Se categoria foi selecionada, usa ela. Caso contrário, cria/usa categoria padrão
      let categoryId: string
      
      if (data.category_id && data.category_id.trim() !== '') {
        // Usa a categoria selecionada pelo usuário
        categoryId = data.category_id
      } else {
        // Se for saldo inicial, usa categoria especial "Saldo Inicial"
        // Para outras transações, usa categoria "Outros"
        if (data.type === 'balance') {
          categoryId = await getOrCreateBalanceCategory(user.id)
        } else {
          categoryId = await getOrCreateDefaultCategory(user.id, data.type)
        }
      }

      // Valida se a categoria foi criada/selecionada corretamente
      if (!categoryId || categoryId.trim() === '') {
        throw new Error('Não foi possível criar a categoria. Tente novamente.')
      }

      // Se for saldo inicial, criar como transação de receita especial
      if (data.type === 'balance') {
        createTransaction({
          user_id: user.id,
          account_id: null,
          category_id: categoryId,
          type: 'income',
          amount: Math.abs(data.amount),
          description: `Saldo inicial: ${data.description}`,
          date: data.date,
        }, {
          onSuccess: () => {
            setToast({ message: 'Saldo inicial adicionado com sucesso!', type: 'success' })
            setModalType(null)
          },
          onError: (error: Error) => {
            setToast({ message: error.message || 'Erro ao adicionar saldo', type: 'error' })
          },
        })
      } else {
        createTransaction({
          user_id: user.id,
          account_id: data.account_id || null,
          category_id: categoryId,
          type: data.type,
          amount: Math.abs(data.amount),
          description: data.description,
          date: data.date,
        }, {
          onSuccess: (created) => {
            const accName = created.account_id
              ? accounts.find(a => a.id === created.account_id)?.name
              : undefined
            const brl = new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(Math.abs(Number(created.amount) || 0))
            if (accName) {
              setToast({
                message:
                  created.type === 'income'
                    ? `Receita de ${brl} na conta "${accName}". Patrimônio atualizado — confira o card Patrimônio total ou a página Contas.`
                    : `Despesa de ${brl} na conta "${accName}". Patrimônio atualizado.`,
                type: 'success',
              })
            } else {
              setToast({
                message:
                  created.type === 'income'
                    ? 'Receita adicionada com sucesso!'
                    : 'Gasto adicionado com sucesso!',
                type: 'success',
              })
            }
            setModalType(null)
          },
          onError: (error: Error) => {
            setToast({ message: error.message || 'Erro ao adicionar transação', type: 'error' })
          },
        })
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Erro ao adicionar transação', type: 'error' })
    }
  }

  const handleAddAccount = async (data: {
    name: string
    type: 'bank' | 'cash' | 'investment' | 'wallet'
    balance: number
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setToast({ message: 'Você precisa estar logado', type: 'error' })
        return
      }

      createAccount({
        user_id: user.id,
        name: data.name,
        type: data.type,
        initial_balance: data.balance,
        current_balance: data.balance, // Saldo inicial = saldo atual
      }, {
        onSuccess: () => {
          setToast({ message: 'Conta criada com sucesso!', type: 'success' })
          setModalType(null)
        },
        onError: (error: Error) => {
          setToast({ message: error.message || 'Erro ao criar conta', type: 'error' })
        },
      })
    } catch (error: any) {
      setToast({ message: error.message || 'Erro ao criar conta', type: 'error' })
    }
  }

  const handleAddCard = async (data: {
    name: string
    limit: number
    closing_day: number
    due_day: number
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setToast({ message: 'Você precisa estar logado', type: 'error' })
        return
      }

      createCard({
        user_id: user.id,
        name: data.name,
        credit_limit: data.limit,
        closing_day: data.closing_day,
        due_day: data.due_day,
      }, {
        onSuccess: () => {
          setToast({ message: 'Cartão adicionado com sucesso!', type: 'success' })
          setModalType(null)
        },
        onError: (error: Error) => {
          setToast({ message: error.message || 'Erro ao adicionar cartão', type: 'error' })
        },
      })
    } catch (error: any) {
      setToast({ message: error.message || 'Erro ao adicionar cartão', type: 'error' })
    }
  }

  const handleAddCardPurchase = async (data: {
    card_id: string
    description: string
    total_amount: number
    installments: number
    purchase_date: string
    category_id?: string
  }) => {
    try {
      const { data: { user } = {} } = await supabase.auth.getUser()
      if (!user) {
        setToast({ message: 'Você precisa estar logado', type: 'error' })
        return
      }

      // Calcula valor da parcela
      const installmentAmount = data.total_amount / data.installments

      // Busca ou cria fatura aberta para o cartão
      const { data: openInvoice } = await supabase
        .from('card_invoices')
        .select('*')
        .eq('card_id', data.card_id)
        .eq('status', 'open')
        .maybeSingle()

      let invoiceId: string

      if (openInvoice) {
        invoiceId = openInvoice.id
        // Atualiza o total da fatura
        await supabase
          .from('card_invoices')
          .update({ 
            total_amount: (openInvoice.total_amount || 0) + installmentAmount 
          })
          .eq('id', invoiceId)
      } else {
        // Cria nova fatura aberta
        const card = cards.find(c => c.id === data.card_id)
        if (!card) {
          throw new Error('Cartão não encontrado')
        }

        // Calcula datas da fatura baseado no dia de fechamento
        const purchaseDate = new Date(data.purchase_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // Se a data da compra for no passado, usa a data atual para calcular as datas da fatura
        const referenceDate = purchaseDate < today ? today : purchaseDate
        const referenceMonth = referenceDate.getMonth()
        const referenceYear = referenceDate.getFullYear()
        
        // Calcula a data de fechamento baseada na data de referência
        const closingDate = new Date(referenceYear, referenceMonth, card.closing_day)
        
        // Se já passou o dia de fechamento no mês de referência, a fatura é do próximo mês
        const invoiceMonth = referenceDate.getDate() <= card.closing_day 
          ? new Date(referenceYear, referenceMonth, 1)
          : new Date(referenceYear, referenceMonth + 1, 1)
        
        // Calcula a data de vencimento
        const dueDate = new Date(referenceYear, referenceMonth, card.due_day)
        if (dueDate < closingDate) {
          dueDate.setMonth(dueDate.getMonth() + 1)
        }
        
        // Se a data de vencimento calculada já passou, ajusta para o próximo ciclo
        if (dueDate < today) {
          dueDate.setMonth(dueDate.getMonth() + 1)
          // Ajusta o mês de referência também se necessário
          if (invoiceMonth.getMonth() === referenceMonth && invoiceMonth.getFullYear() === referenceYear) {
            invoiceMonth.setMonth(invoiceMonth.getMonth() + 1)
          }
        }

        const { data: newInvoice, error: invoiceError } = await supabase
          .from('card_invoices')
          .insert({
            user_id: user.id,
            card_id: data.card_id,
            reference_month: invoiceMonth.toISOString().split('T')[0],
            closing_date: closingDate.toISOString().split('T')[0],
            due_date: dueDate.toISOString().split('T')[0],
            status: 'open',
            total_amount: installmentAmount,
          })
          .select()
          .single()

        if (invoiceError || !newInvoice) {
          throw new Error('Erro ao criar fatura: ' + (invoiceError?.message || 'Erro desconhecido'))
        }

        invoiceId = newInvoice.id
      }

      // Cria a compra
      createPurchase({
        user_id: user.id,
        card_id: data.card_id,
        description: data.description,
        total_amount: data.total_amount,
        installments: data.installments,
        installment_amount: installmentAmount,
        current_installment: 1,
        purchase_date: data.purchase_date,
        category_id: data.category_id || null,
      }, {
        onSuccess: () => {
          setToast({ 
            message: `Compra adicionada! ${data.installments}x de R$ ${installmentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
            type: 'success' 
          })
          setModalType(null)
          setSelectedCardId(undefined)
        },
        onError: (error: Error) => {
          setToast({ message: error.message || 'Erro ao adicionar compra', type: 'error' })
        },
      })
    } catch (error: any) {
      console.error('Erro ao adicionar compra:', error)
      setToast({ message: error.message || 'Erro ao adicionar compra', type: 'error' })
    }
  }

  const handleAddGoal = async (data: {
    name: string
    target_amount: number
    target_date: string | null
    current_amount?: number
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setToast({ message: 'Você precisa estar logado', type: 'error' })
        return
      }

      createGoal({
        user_id: user.id,
        name: data.name,
        target_amount: data.target_amount,
        current_amount: data.current_amount || 0,
        target_date: data.target_date || null,
      }, {
        onSuccess: () => {
          setToast({ message: 'Meta criada com sucesso!', type: 'success' })
          setModalType(null)
        },
        onError: (error: Error) => {
          setToast({ message: error.message || 'Erro ao criar meta', type: 'error' })
        },
      })
    } catch (error: any) {
      setToast({ message: error.message || 'Erro ao criar meta', type: 'error' })
    }
  }

  const handleAddRecurringExpense = async (data: {
    name: string
    amount: number
    due_day: number
    category_id?: string
    account_id?: string
    description?: string
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setToast({ message: 'Você precisa estar logado', type: 'error' })
        return
      }

      if (editingRecurringExpense) {
        updateExpense({
          id: editingRecurringExpense.id,
          data: {
            name: data.name,
            amount: data.amount,
            due_day: data.due_day,
            category_id: data.category_id || null,
            account_id: data.account_id || null,
            description: data.description || null,
          },
        }, {
          onSuccess: () => {
            setToast({ message: 'Despesa recorrente atualizada com sucesso!', type: 'success' })
            setModalType(null)
            setEditingRecurringExpense(null)
          },
          onError: (error: Error) => {
            setToast({ message: error.message || 'Erro ao atualizar despesa recorrente', type: 'error' })
          },
        })
      } else {
        createExpense({
          user_id: user.id,
          name: data.name,
          amount: data.amount,
          due_day: data.due_day,
          category_id: data.category_id || null,
          account_id: data.account_id || null,
          description: data.description || null,
          is_active: true,
        }, {
          onSuccess: () => {
            setToast({ message: 'Despesa recorrente criada com sucesso!', type: 'success' })
            setModalType(null)
          },
          onError: (error: Error) => {
            setToast({ message: error.message || 'Erro ao criar despesa recorrente', type: 'error' })
          },
        })
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Erro ao salvar despesa recorrente', type: 'error' })
    }
  }

  const handleAddCategory = async (data: {
    name: string
    type: 'expense' | 'income'
    icon?: string
    color?: string
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setToast({ message: 'Você precisa estar logado', type: 'error' })
        return
      }

      // Verifica se já existe uma categoria com o mesmo nome
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('name', data.name.trim())
        .maybeSingle()

      if (existingCategories) {
        setToast({ 
          message: `Já existe uma categoria chamada "${data.name}"`, 
          type: 'error' 
        })
        return
      }

      createCategory({
        user_id: user.id,
        name: data.name.trim(),
        type: data.type, // Obrigatório: 'expense' ou 'income'
        icon: data.icon || null,
        color: data.color || null,
      }, {
        onSuccess: () => {
          setToast({ message: 'Categoria criada com sucesso!', type: 'success' })
          setModalType(null)
        },
        onError: (error: Error) => {
          console.error('Erro ao criar categoria:', error)
          console.error('Stack:', error.stack)
          
          // Tenta extrair mensagem mais específica do erro
          let errorMessage = error.message || 'Erro ao criar categoria'
          
          // Mensagens mais amigáveis para erros comuns
          if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
            errorMessage = 'Já existe uma categoria com este nome'
          } else if (errorMessage.includes('null value') || errorMessage.includes('not null')) {
            errorMessage = 'Todos os campos obrigatórios devem ser preenchidos'
          } else if (errorMessage.includes('violates')) {
            errorMessage = 'Dados inválidos. Verifique os campos preenchidos'
          }
          
          setToast({ 
            message: errorMessage, 
            type: 'error' 
          })
        },
      })
    } catch (error: any) {
      console.error('Erro ao criar categoria:', error)
      setToast({ 
        message: error.message || 'Erro ao criar categoria', 
        type: 'error' 
      })
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header com gradiente sutil */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 lg:mb-8 pb-4 lg:pb-6 border-b border-border dark:border-border-dark">
        <div>
          <h1 className="text-xl lg:text-h1 font-bold text-neutral-900 dark:text-neutral-50 mb-1 lg:mb-2">Dashboard</h1>
          <p className="text-sm lg:text-body-sm text-neutral-500 dark:text-neutral-400">
            Visão geral das suas finanças • {new Date().toLocaleDateString('pt-BR', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 lg:gap-3">
          <Button 
            variant="primary" 
            size="lg"
            onClick={() => {
              setTransactionType('expense')
              setModalType('transaction')
            }}
            className="shadow-lg hover:shadow-xl transition-shadow duration-fast w-full sm:w-auto justify-center"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Adicionar transação</span>
            <span className="sm:hidden">Nova transação</span>
          </Button>
          <Button 
            variant="secondary" 
            size="lg"
            onClick={() => {
              setTransactionType('balance')
              setModalType('transaction')
            }}
            className="shadow-lg hover:shadow-xl transition-shadow duration-fast w-full sm:w-auto justify-center"
          >
            💳 Saldo inicial
          </Button>
        </div>
      </div>

      {/* Cards financeiros com melhor visual */}
      <div className="space-y-4 lg:space-y-6 mb-6 lg:mb-8">
        {/* Valor total = soma dos saldos atuais em contas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          <FinancialCard
            title="Valor total"
            value={totalRealWealth}
            subtitle="Soma dos saldos atuais em todas as contas."
            variant="purple"
            icon={
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <span className="text-2xl">💵</span>
              </div>
            }
            onClick={() => setShowTotalMoneyModal(true)}
            className="cursor-pointer"
          />
          <FinancialCard
            title="Receitas do mês"
            value={monthlyIncome}
            subtitle="Transações de receita neste mês (calendário)"
            variant="success"
            icon={
              <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            }
          />
          <div className={showAllCards ? 'block' : 'hidden lg:block'}>
            <FinancialCard
              title="Investimentos"
              value={totalInvestments}
              subtitle="Só contas tipo investimento"
              variant="default"
              icon={
                <div className="w-12 h-12 rounded-full bg-warning-100 flex items-center justify-center">
                  <span className="text-2xl">📈</span>
                </div>
              }
            />
          </div>
        </div>

        {/* Linha inferior: Despesas do mês e Próximo mês */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 ${showAllCards ? 'block' : 'hidden lg:grid'}`}>
          <FinancialCard
            title="Despesas do mês"
            value={monthlyExpenses}
            subtitle="Somente gastos pagos no mês"
            variant="danger"
            icon={
              <div className="w-12 h-12 rounded-full bg-danger-100 flex items-center justify-center">
                <span className="text-2xl">💸</span>
              </div>
            }
            onClick={() => setShowMonthlyExpenses(true)}
            className="cursor-pointer hover:shadow-xl transition-shadow"
          />
          {(() => {
            const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
            const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear
            const nextMonthName = new Date(nextMonthYear, nextMonth - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            
            const nextMonthTransactions = transactions.filter(transaction => {
              const transactionDate = parseLocalDate(transaction.date)
              return (
                transaction.type === 'expense' &&
                transactionDate.getMonth() + 1 === nextMonth &&
                transactionDate.getFullYear() === nextMonthYear
              )
            })
            
            const nextMonthExpenses = nextMonthTransactions
              .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount) || 0), 0)

            const nextMonthFixedPurchases = purchases.filter(purchase => {
              // Verifica se ainda há parcelas a pagar
              if (purchase.current_installment > purchase.installments) {
                return false
              }

              const purchaseDate = new Date(purchase.purchase_date)
              const purchaseMonth = purchaseDate.getMonth() + 1
              const purchaseYear = purchaseDate.getFullYear()
              
              // Se a compra foi feita no mês M, a primeira parcela é paga no mês M+1
              // Então a parcela N é paga no mês M + N
              // Calcula qual parcela será paga no próximo mês
              const monthsDiff = (nextMonthYear - purchaseYear) * 12 + (nextMonth - purchaseMonth)
              const installmentToPay = monthsDiff
              
              // Verifica se:
              // 1. A parcela a ser paga está dentro do range (1 a installments)
              // 2. A parcela ainda não foi paga (installmentToPay >= current_installment)
              // 3. A parcela será paga no próximo mês (monthsDiff >= 0)
              return (
                monthsDiff >= 0 &&
                installmentToPay >= purchase.current_installment &&
                installmentToPay <= purchase.installments
              )
            })

            const nextMonthFixedExpenses = nextMonthFixedPurchases
              .reduce((sum, purchase) => sum + (purchase.installment_amount || 0), 0)

            // Adiciona despesas recorrentes ativas que vencem no próximo mês
            const nextMonthRecurringExpensesList = recurringExpenses.filter(expense => {
              if (!expense.is_active) return false
              
              // Todas as despesas recorrentes ativas vencem todo mês no mesmo dia
              // Então sempre devem ser incluídas no próximo mês
              console.log(`🔄 Despesa recorrente: ${expense.name} - R$ ${expense.amount} - Vence dia ${expense.due_day}`)
              return true
            })

            const nextMonthRecurringExpenses = nextMonthRecurringExpensesList
              .reduce((sum, expense) => sum + (expense.amount || 0), 0)

            // Adiciona faturas abertas dos cartões que vencem no próximo mês
            const nextMonthInvoices = invoices.filter(invoice => {
              if (invoice.status !== 'open') return false
              
              const invoiceDueDate = new Date(invoice.due_date)
              invoiceDueDate.setHours(0, 0, 0, 0)
              const invoiceMonth = invoiceDueDate.getMonth() + 1
              const invoiceYear = invoiceDueDate.getFullYear()
              
              const matches = invoiceMonth === nextMonth && invoiceYear === nextMonthYear
              
              if (invoice.total_amount > 0) {
                console.log(`💳 Fatura: ${invoice.total_amount} vence em ${invoiceMonth}/${invoiceYear}, próximo mês: ${nextMonth}/${nextMonthYear}, match: ${matches}`)
              }
              
              return matches
            })

            const nextMonthInvoiceExpenses = nextMonthInvoices
              .reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0)

            // Debug: log dos valores calculados
            console.log('📊 Cálculo Próximo Mês:', {
              nextMonth: `${nextMonth}/${nextMonthYear}`,
              nextMonthExpenses,
              nextMonthFixedExpenses,
              nextMonthRecurringExpenses,
              nextMonthInvoiceExpenses,
              totalNextMonth: nextMonthExpenses + nextMonthFixedExpenses + nextMonthRecurringExpenses + nextMonthInvoiceExpenses,
              recurringExpensesList: nextMonthRecurringExpensesList.map(e => ({ name: e.name, amount: e.amount })),
              invoicesList: nextMonthInvoices.map(i => ({ due_date: i.due_date, total_amount: i.total_amount }))
            })

            const totalNextMonth = nextMonthExpenses + nextMonthFixedExpenses + nextMonthRecurringExpenses + nextMonthInvoiceExpenses

            return (
              <>
                <FinancialCard
                  title="Próximo mês"
                  value={totalNextMonth}
                  subtitle="Despesas previstas"
                  variant="danger"
                  icon={
                    <div className="w-12 h-12 rounded-full bg-danger-100 flex items-center justify-center">
                      <span className="text-2xl">📅</span>
                    </div>
                  }
                  onClick={() => setShowNextMonthDetails(true)}
                  className="cursor-pointer hover:shadow-xl transition-shadow"
                />
                <NextMonthExpensesModal
                  isOpen={showNextMonthDetails}
                  onClose={() => setShowNextMonthDetails(false)}
                  nextMonthExpenses={nextMonthExpenses}
                  nextMonthFixedExpenses={nextMonthFixedExpenses}
                  nextMonthRecurringExpenses={nextMonthRecurringExpenses}
                  totalNextMonth={totalNextMonth}
                  fixedExpensesDetails={nextMonthFixedPurchases}
                  recurringExpensesDetails={nextMonthRecurringExpensesList}
                  transactionsDetails={nextMonthTransactions}
                  nextMonthName={nextMonthName}
                />
              </>
            )
          })()}
        </div>

        {/* Botão Ver mais / Ver menos - apenas no mobile */}
        <div className="lg:hidden flex justify-center pt-2">
          <Button
            variant="secondary"
            onClick={() => setShowAllCards(!showAllCards)}
            className="w-full sm:w-auto min-w-[200px]"
          >
            {showAllCards ? (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
                Ver menos
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                Ver mais
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Seção de insights rápidos melhorada */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Insights Inteligentes com IA */}
        <InsightsCard
          monthlyData={{
            income: monthlyIncome,
            expenses: monthlyExpenses,
            balance: monthlyFlowBalance,
            investments: totalInvestments,
            nextMonthExpenses: (() => {
              const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
              const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear
              const nextMonthTransactions = transactions.filter(transaction => {
                const transactionDate = parseLocalDate(transaction.date)
                return (
                  transaction.type === 'expense' &&
                  transactionDate.getMonth() + 1 === nextMonth &&
                  transactionDate.getFullYear() === nextMonthYear
                )
              })
              return nextMonthTransactions.reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount) || 0), 0)
            })(),
            nextMonthFixedExpenses: (() => {
              const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
              const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear
              const nextMonthFixedPurchases = purchases.filter(purchase => {
                if (purchase.current_installment > purchase.installments) return false
                const purchaseDate = new Date(purchase.purchase_date)
                const purchaseMonth = purchaseDate.getMonth() + 1
                const purchaseYear = purchaseDate.getFullYear()
                const monthsDiff = (nextMonthYear - purchaseYear) * 12 + (nextMonth - purchaseMonth)
                const installmentToPay = monthsDiff
                return (
                  monthsDiff >= 0 &&
                  installmentToPay >= purchase.current_installment &&
                  installmentToPay <= purchase.installments
                )
              })
              return nextMonthFixedPurchases.reduce((sum, purchase) => sum + (purchase.installment_amount || 0), 0)
            })(),
            nextMonthRecurringExpenses: (() => {
              const activeRecurring = recurringExpenses.filter(e => e.is_active)
              return activeRecurring.reduce((sum, expense) => sum + (expense.amount || 0), 0)
            })(),
            nextMonthInvoiceExpenses: (() => {
              const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
              const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear
              const nextMonthInvoices = invoices.filter(invoice => {
                if (invoice.status !== 'open') return false
                const invoiceDueDate = new Date(invoice.due_date)
                const invoiceMonth = invoiceDueDate.getMonth() + 1
                const invoiceYear = invoiceDueDate.getFullYear()
                return invoiceMonth === nextMonth && invoiceYear === nextMonthYear
              })
              return nextMonthInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0)
            })(),
            previousMonthIncome,
            previousMonthExpenses,
            expectedSurplus,
            previousMonthSurplus,
            recurringExpenses: recurringExpenses.filter(e => e.is_active).map(e => ({
              name: e.name,
              amount: e.amount,
              due_day: e.due_day
            })),
            topExpenses: transactions
              .filter(t => t.type === 'expense')
              .map(t => {
                const category = categories.find(c => c.id === t.category_id)
                return {
                  description: t.description,
                  amount: Math.abs(Number(t.amount) || 0),
                  category: category?.name
                }
              })
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 5),
            monthName: new Date(currentYear, currentMonth - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
            nextMonthName: (() => {
              const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
              const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear
              return new Date(nextMonthYear, nextMonth - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            })()
          }}
        />

        <div className="bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900/40 dark:to-neutral-950/40 rounded-card-lg p-6 border border-border dark:border-border-dark/70 shadow-card hover:shadow-card-hover transition-all duration-fast dark:backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <h2 className="text-h3 font-semibold text-neutral-900 dark:text-neutral-50">Saúde do mês</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white dark:bg-neutral-900/40 rounded-lg border border-border dark:border-border-dark/70">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📈</span>
                  <span className="text-body-sm text-neutral-600 dark:text-neutral-300">Sobra prevista</span>
                </div>
                {previousMonthSurplus !== 0 && (
                  <span className={`text-caption ml-7 ${
                    surplusVariation >= 0 ? 'text-success-600 dark:text-success-500' : 'text-danger-600 dark:text-danger-400'
                  }`}>
                    {surplusVariation >= 0 ? '↑' : '↓'} {Math.abs(surplusVariation).toFixed(1)}% vs mês anterior
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-body font-bold ${
                  expectedSurplus >= 0 ? 'text-success-600 dark:text-success-500' : 'text-danger-600 dark:text-danger-400'
                }`}>
                  {expectedSurplus >= 0 ? '+' : ''}R$ {expectedSurplus.toLocaleString('pt-BR', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </span>
                {previousMonthSurplus !== 0 && (
                  <span className="text-caption text-neutral-500 dark:text-neutral-400">
                    Mês anterior: R$ {previousMonthSurplus.toLocaleString('pt-BR', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-white dark:bg-neutral-900/40 rounded-lg border border-border dark:border-border-dark/70">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💰</span>
                  <span className="text-body-sm text-neutral-600 dark:text-neutral-300">Receitas</span>
                </div>
                {previousMonthIncome > 0 && (
                  <span className={`text-caption ml-7 ${
                    monthlyIncome >= previousMonthIncome ? 'text-success-600 dark:text-success-500' : 'text-danger-600 dark:text-danger-400'
                  }`}>
                    {monthlyIncome >= previousMonthIncome ? '↑' : '↓'} {
                      previousMonthIncome > 0 
                        ? Math.abs(((monthlyIncome - previousMonthIncome) / previousMonthIncome) * 100).toFixed(1)
                        : '0'
                    }% vs mês anterior
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-body font-bold text-success-600 dark:text-success-500">
                  R$ {monthlyIncome.toLocaleString('pt-BR', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </span>
                {previousMonthIncome > 0 && (
                  <span className="text-caption text-neutral-500 dark:text-neutral-400">
                    Mês anterior: R$ {previousMonthIncome.toLocaleString('pt-BR', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-white dark:bg-neutral-900/40 rounded-lg border border-border dark:border-border-dark/70">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💸</span>
                  <span className="text-body-sm text-neutral-600 dark:text-neutral-300">Despesas</span>
                </div>
                {previousMonthExpenses > 0 && (
                  <span className={`text-caption ml-7 ${
                    monthlyExpenses <= previousMonthExpenses ? 'text-success-600 dark:text-success-500' : 'text-danger-600 dark:text-danger-400'
                  }`}>
                    {monthlyExpenses <= previousMonthExpenses ? '↓' : '↑'} {
                      previousMonthExpenses > 0
                        ? Math.abs(((monthlyExpenses - previousMonthExpenses) / previousMonthExpenses) * 100).toFixed(1)
                        : '0'
                    }% vs mês anterior
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-body font-bold text-danger-600 dark:text-danger-400">
                  R$ {monthlyExpenses.toLocaleString('pt-BR', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </span>
                {previousMonthExpenses > 0 && (
                  <span className="text-caption text-neutral-500 dark:text-neutral-400">
                    Mês anterior: R$ {previousMonthExpenses.toLocaleString('pt-BR', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Seção de Orçamento por Categoria */}
      <CategoryBudgetsSection
        categories={categories}
        transactions={transactions}
        cardPurchases={purchases}
        invoices={invoices}
        recurringExpenses={recurringExpenses}
      />

      {/* Seção de ações rápidas */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900 rounded-card-lg p-4 lg:p-6 border border-primary-200 dark:border-primary-800">
        <h2 className="text-lg lg:text-h3 font-semibold text-neutral-900 dark:text-neutral-50 mb-3 lg:mb-4">Ações rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 lg:gap-3">
          <button 
            onClick={() => setModalType('account')}
            className="p-3 lg:p-4 bg-white dark:bg-neutral-900 rounded-lg border border-border dark:border-border-dark hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md active:scale-95 lg:hover:scale-105 transition-all duration-fast text-left"
          >
            <div className="text-xl lg:text-2xl mb-1 lg:mb-2">🏦</div>
            <div className="text-xs lg:text-body-sm font-medium text-neutral-900 dark:text-neutral-50">Nova conta</div>
          </button>
          <button 
            onClick={() => setModalType('card')}
            className="p-3 lg:p-4 bg-white dark:bg-neutral-900 rounded-lg border border-border dark:border-border-dark hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md active:scale-95 lg:hover:scale-105 transition-all duration-fast text-left"
          >
            <div className="text-xl lg:text-2xl mb-1 lg:mb-2">💳</div>
            <div className="text-xs lg:text-body-sm font-medium text-neutral-900 dark:text-neutral-50">Novo cartão</div>
          </button>
          <button 
            onClick={() => {
              if (cards.length === 0) {
                setToast({ message: 'Adicione um cartão primeiro', type: 'error' })
                return
              }
              setModalType('cardPurchase')
            }}
            className="p-3 lg:p-4 bg-white dark:bg-neutral-900 rounded-lg border border-border dark:border-border-dark hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md active:scale-95 lg:hover:scale-105 transition-all duration-fast text-left"
          >
            <div className="text-xl lg:text-2xl mb-1 lg:mb-2">🛒</div>
            <div className="text-xs lg:text-body-sm font-medium text-neutral-900 dark:text-neutral-50">Nova compra</div>
          </button>
          <button 
            onClick={() => setModalType('goal')}
            className="p-3 lg:p-4 bg-white dark:bg-neutral-900 rounded-lg border border-border dark:border-border-dark hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md active:scale-95 lg:hover:scale-105 transition-all duration-fast text-left"
          >
            <div className="text-xl lg:text-2xl mb-1 lg:mb-2">🎯</div>
            <div className="text-xs lg:text-body-sm font-medium text-neutral-900 dark:text-neutral-50">Nova meta</div>
          </button>
          <button 
            onClick={() => {
              setEditingRecurringExpense(null)
              setModalType('recurringExpense')
            }}
            className="p-3 lg:p-4 bg-white dark:bg-neutral-900 rounded-lg border border-border dark:border-border-dark hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md active:scale-95 lg:hover:scale-105 transition-all duration-fast text-left"
          >
            <div className="text-xl lg:text-2xl mb-1 lg:mb-2">🔄</div>
            <div className="text-xs lg:text-body-sm font-medium text-neutral-900 dark:text-neutral-50">Despesa recorrente</div>
          </button>
          <button 
            onClick={() => navigate('/reports')}
            className="p-3 lg:p-4 bg-white dark:bg-neutral-900 rounded-lg border border-border dark:border-border-dark hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md active:scale-95 lg:hover:scale-105 transition-all duration-fast text-left"
          >
            <div className="text-xl lg:text-2xl mb-1 lg:mb-2">📊</div>
            <div className="text-xs lg:text-body-sm font-medium text-neutral-900 dark:text-neutral-50">Ver relatórios</div>
          </button>
        </div>
        <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-primary-200 dark:border-primary-800">
          <button 
            onClick={() => setModalType('category')}
            className="w-full p-3 bg-white dark:bg-neutral-900 rounded-lg border border-primary-300 dark:border-primary-700 hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md active:scale-95 transition-all duration-fast text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">📁</span>
              <span className="text-sm lg:text-body-sm font-medium text-neutral-900 dark:text-neutral-50">Nova categoria</span>
            </div>
          </button>
        </div>
      </div>

      {/* Seção de Metas */}
      {goals.length > 0 && (
        <div className="mb-8 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3 font-semibold text-neutral-900 dark:text-neutral-50">Minhas Metas</h2>
            <button
              onClick={() => navigate('/goals')}
              className="text-body-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              Ver todas →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.slice(0, 3).map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
          {goals.length > 3 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate('/goals')}
                className="text-body-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                Ver mais {goals.length - 3} meta{goals.length - 3 > 1 ? 's' : ''} →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Seção de Financiamentos e Despesas Recorrentes */}
      {recurringExpenses.length > 0 && (
        <div className="mb-8 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3 font-semibold text-neutral-900 dark:text-neutral-50">Financiamentos e Despesas Recorrentes</h2>
            <button
              onClick={() => {
                setEditingRecurringExpense(null)
                setModalType('recurringExpense')
              }}
              className="text-body-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              + Adicionar
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recurringExpenses.map((expense) => {
              const category = categories.find(cat => cat.id === expense.category_id)
              return (
                <RecurringExpenseCard
                  key={expense.id}
                  expense={expense}
                  category={category}
                  onEdit={(exp) => {
                    setEditingRecurringExpense(exp)
                    setModalType('recurringExpense')
                  }}
                  onDelete={(id) => {
                    deleteExpense(id, {
                      onSuccess: () => {
                        setToast({ message: 'Despesa recorrente excluída com sucesso!', type: 'success' })
                      },
                      onError: (error: Error) => {
                        setToast({ message: error.message || 'Erro ao excluir despesa recorrente', type: 'error' })
                      },
                    })
                  }}
                  onToggleActive={(id, isActive) => {
                    updateExpense({
                      id,
                      data: { is_active: isActive },
                    }, {
                      onSuccess: () => {
                        setToast({ 
                          message: isActive ? 'Despesa recorrente ativada!' : 'Despesa recorrente desativada!', 
                          type: 'success' 
                        })
                      },
                      onError: (error: Error) => {
                        setToast({ message: error.message || 'Erro ao atualizar despesa', type: 'error' })
                      },
                    })
                  }}
                  onUpdate={(id, data, callbacks) => {
                    updateExpense({ id, data }, {
                      onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['recurring_expenses'] })
                        callbacks?.onSuccess?.()
                      },
                      onError: (error: Error) => {
                        callbacks?.onError?.(error)
                      },
                    })
                  }}
                  onToast={(message, type) => setToast({ message, type })}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Botão para adicionar despesa recorrente quando não há nenhuma */}
      {recurringExpenses.length === 0 && (
        <div className="mb-8 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3 font-semibold text-neutral-900 dark:text-neutral-50">Financiamentos e Despesas Recorrentes</h2>
            <button
              onClick={() => {
                setEditingRecurringExpense(null)
                setModalType('recurringExpense')
              }}
              className="text-body-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              + Adicionar
            </button>
          </div>
          <div className="p-8 bg-neutral-50 dark:bg-neutral-900/30 rounded-lg border border-border dark:border-border-dark text-center">
            <p className="text-body-sm text-neutral-500 dark:text-neutral-300 mb-4">
              Adicione financiamentos, internet, aluguel e outras despesas recorrentes fixas
            </p>
            <Button
              variant="primary"
              onClick={() => {
                setEditingRecurringExpense(null)
                setModalType('recurringExpense')
              }}
            >
              + Adicionar primeira despesa recorrente
            </Button>
          </div>
        </div>
      )}

      {/* Lista de cartões */}
      {cards.length > 0 && (
        <div className="mb-8 mt-8">
          <h2 className="text-h3 font-semibold text-neutral-900 dark:text-neutral-50 mb-4">Meus cartões</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => {
              const cardInvoices = invoices.filter(inv => inv.card_id === card.id)
              // Só considera fatura do ciclo atual: vencimento no mês atual ou no futuro (evita mostrar fatura do mês passado como "atual" ao virar o mês)
              const startOfCurrentMonth = new Date(currentYear, currentMonth - 1, 1)
              startOfCurrentMonth.setHours(0, 0, 0, 0)
              const invoicesCurrentCycle = cardInvoices.filter(inv => {
                const due = new Date(inv.due_date)
                due.setHours(0, 0, 0, 0)
                return due >= startOfCurrentMonth
              })
              const openInvoice = invoicesCurrentCycle.find(inv => inv.status === 'open')
              const paidInvoice = invoicesCurrentCycle.find(inv => inv.status === 'paid')
              const currentInvoice = openInvoice || paidInvoice
              // Busca a última fatura para mostrar informações quando não há fatura atual
              const lastInvoice = cardInvoices.sort((a, b) => 
                new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
              )[0]
              const cardPurchases = purchases.filter(p => p.card_id === card.id)
              const activePurchases = cardPurchases.filter(p => p.current_installment <= p.installments)
              const invoiceDueDate = currentInvoice ? new Date(currentInvoice.due_date) : null
              const invoiceMonthForCalculation = invoiceDueDate ? invoiceDueDate.getMonth() + 1 : currentMonth
              const invoiceYearForCalculation = invoiceDueDate ? invoiceDueDate.getFullYear() : currentYear
              const calculatedInvoiceTotal = calculateCardInvoiceTotalForMonth(
                card.id,
                invoiceMonthForCalculation,
                invoiceYearForCalculation
              )
              const invoiceTotal = calculatedInvoiceTotal > 0 ? calculatedInvoiceTotal : (currentInvoice?.total_amount || 0)
              const availableLimit = card.credit_limit - invoiceTotal
              const usagePercentage = card.credit_limit > 0
                ? Math.max(0, Math.min(100, (invoiceTotal / card.credit_limit) * 100))
                : 0

              return (
                <div
                  key={card.id}
                  onClick={() => setSelectedCardForModal(card.id)}
                  className="p-5 bg-white dark:bg-neutral-900/50 rounded-card-lg border border-border dark:border-border-dark/70 hover:border-primary-400/70 dark:hover:border-primary-500/70 hover:shadow-xl cursor-pointer transition-all duration-fast dark:backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">💳</span>
                      <h3 className="text-body font-semibold text-neutral-900 dark:text-neutral-50">{card.name}</h3>
                    </div>
                    {(currentInvoice || lastInvoice) && (() => {
                      const invoiceRef = currentInvoice || lastInvoice
                      if (!invoiceRef) return null

                      // Sem fatura aberta, manter padrão visual dos outros cartões:
                      // usa apenas PAGA/A PAGAR com base na última fatura.
                      if (!currentInvoice) {
                        const isPaid = invoiceRef.status === 'paid'
                        const badgeText = isPaid ? 'PAGA' : 'A PAGAR'
                        const badgeColor = isPaid
                          ? 'bg-success-100 text-success-700 border-success-300'
                          : 'bg-warning-100 text-warning-700 border-warning-300'
                        return (
                          <span className={`px-2.5 py-1 text-caption font-semibold rounded-full border ${badgeColor} shadow-sm`}>
                            {badgeText}
                          </span>
                        )
                      }

                      const invoiceDueDate = new Date(currentInvoice.due_date)
                      const invoiceMonth = invoiceDueDate.getMonth() + 1
                      const invoiceDay = invoiceDueDate.getDate()
                      
                      const today = new Date()
                      const todayDay = today.getDate()
                      
                      // Paga só se marcou no mês atual - ao virar o mês, fica false automaticamente
                      const isPaid = currentInvoice.status === 'paid'
                      
                      // Verifica se está atrasada baseado apenas em mês e dia (ignorando o ano)
                      let isOverdue = false
                      if (!isPaid) {
                        const normalizedInvoiceDate = new Date(currentYear, invoiceMonth - 1, invoiceDay)
                        const normalizedToday = new Date(currentYear, currentMonth - 1, todayDay)
                        
                        if (normalizedInvoiceDate < normalizedToday) {
                          isOverdue = true
                        }
                      }
                      
                      // Determina qual badge mostrar
                      let badgeText = ''
                      let badgeColor = ''
                      
                      if (isPaid) {
                        badgeText = 'PAGA'
                        badgeColor = 'bg-success-100 text-success-700 border-success-300'
                      } else if (isOverdue) {
                        badgeText = 'ATRASADA'
                        badgeColor = 'bg-danger-100 text-danger-700 border-danger-300'
                      } else {
                        badgeText = 'A PAGAR'
                        badgeColor = 'bg-warning-100 text-warning-700 border-warning-300'
                      }
                      
                      return (
                        <span className={`px-2.5 py-1 text-caption font-semibold rounded-full border ${badgeColor} shadow-sm`}>
                          {badgeText}
                        </span>
                      )
                    })()}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-body-sm">
                      <span className="text-neutral-600 dark:text-neutral-300">Limite:</span>
                      <span className="font-medium text-neutral-900 dark:text-neutral-50">
                        R$ {card.credit_limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    {currentInvoice ? (() => {
                      const isPaid = currentInvoice.status === 'paid'
                      
                      return (
                        <>
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-caption text-neutral-500 dark:text-neutral-400">Uso do limite</span>
                              <span className="text-caption font-semibold text-neutral-700 dark:text-neutral-200">
                                {usagePercentage.toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  usagePercentage >= 85
                                    ? 'bg-danger-500'
                                    : usagePercentage >= 60
                                      ? 'bg-warning-500'
                                      : 'bg-success-500'
                                }`}
                                style={{ width: `${usagePercentage}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-between text-body-sm">
                            <span className="text-neutral-600 dark:text-neutral-300">Fatura atual:</span>
                            <span className="font-bold text-danger-600 dark:text-danger-400">
                              R$ {invoiceTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between text-body-sm">
                            <span className="text-neutral-600 dark:text-neutral-300">Disponível:</span>
                            <span className="font-medium text-success-600 dark:text-success-500">
                              R$ {availableLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-caption text-neutral-500 mt-2 pt-2 border-t border-border dark:border-border-dark">
                            <div className="flex items-center gap-2">
                              <span>Vence: {new Date(currentInvoice.due_date).toLocaleDateString('pt-BR')}</span>
                              <span>•</span>
                              <span>{activePurchases.length} compra(s)</span>
                            </div>
                            <label 
                              className="flex items-center gap-1.5 cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={isPaid}
                                onChange={async (e) => {
                                  e.stopPropagation()
                                  const checked = e.target.checked

                                  try {
                                    if (checked) {
                                      await advanceInstallmentsAfterInvoicePayment(
                                        card.id,
                                        invoiceMonthForCalculation,
                                        invoiceYearForCalculation
                                      )
                                    }
                                  } catch (error) {
                                    const message = error instanceof Error ? error.message : 'Erro ao atualizar parcelas da fatura'
                                    setToast({ message, type: 'error' })
                                    return
                                  }

                                  updateInvoice(
                                    { 
                                      id: currentInvoice.id, 
                                      data: { 
                                        status: checked ? 'paid' : 'open',
                                        total_amount: invoiceTotal,
                                        last_paid_reference_month: checked ? currentMonthStr : null
                                      } 
                                    },
                                    {
                                      onSuccess: () => {
                                        queryClient.invalidateQueries({ queryKey: ['card_invoices'] })
                                        queryClient.invalidateQueries({ queryKey: ['accounts'] })
                                        setToast({ 
                                          message: checked 
                                            ? 'Fatura marcada como paga — valor incluído em Despesas do mês' 
                                            : 'Fatura reaberta', 
                                          type: 'success' 
                                        })
                                      },
                                      onError: (error: Error) => {
                                        setToast({ 
                                          message: error.message || 'Erro ao atualizar fatura', 
                                          type: 'error' 
                                        })
                                      },
                                    }
                                  )
                                }}
                                disabled={isUpdatingInvoice}
                                className="w-4 h-4 text-success-600 border-border rounded focus:ring-success-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              <span className="text-caption text-neutral-600">
                                Paga
                              </span>
                            </label>
                          </div>
                        </>
                      )
                    })() : (
                      <div className="space-y-2">
                        <div className="text-caption text-neutral-500">Nenhuma fatura aberta</div>
                        {lastInvoice && (
                          <div className="pt-2 border-t border-border space-y-2">
                            <div className="text-caption text-neutral-400">
                              Última fatura: {lastInvoice.status === 'paid' ? 'Paga' : lastInvoice.status === 'closed' ? 'Fechada' : 'Aberta'} 
                              {lastInvoice.due_date && ` • Venceu em ${new Date(lastInvoice.due_date).toLocaleDateString('pt-BR')}`}
                            </div>
                            <div className="flex items-center justify-end">
                              <label
                                className="flex items-center gap-1.5 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={lastInvoice.status === 'paid'}
                                  disabled={isUpdatingInvoice}
                                  onChange={(e) => {
                                    e.stopPropagation()
                                    const checked = e.target.checked
                                    updateInvoice(
                                      {
                                        id: lastInvoice.id,
                                        data: {
                                          status: checked ? 'paid' : 'open',
                                          last_paid_reference_month: checked ? currentMonthStr : null,
                                        },
                                      },
                                      {
                                        onSuccess: () => {
                                          queryClient.invalidateQueries({ queryKey: ['card_invoices'] })
                                          setToast({
                                            message: checked ? 'Fatura marcada como paga' : 'Fatura reaberta',
                                            type: 'success',
                                          })
                                        },
                                        onError: (error: Error) => {
                                          setToast({
                                            message: error.message || 'Erro ao atualizar fatura',
                                            type: 'error',
                                          })
                                        },
                                      }
                                    )
                                  }}
                                  className="w-4 h-4 text-success-600 border-border dark:border-border-dark rounded focus:ring-success-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <span className="text-caption text-neutral-600">Paga</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modais */}
      <Modal
        isOpen={modalType === 'transaction'}
        onClose={() => setModalType(null)}
        title="Adicionar transação"
        size="md"
      >
        <AddTransactionForm
          onSubmit={handleAddTransaction}
          onCancel={() => setModalType(null)}
          initialType={transactionType}
          isLoading={isCreating}
        />
      </Modal>

      <Modal
        isOpen={modalType === 'account'}
        onClose={() => setModalType(null)}
        title="Nova conta"
        size="md"
      >
        <AddAccountForm
          onSubmit={handleAddAccount}
          onCancel={() => setModalType(null)}
          isLoading={isCreatingAccount}
        />
      </Modal>

      <Modal
        isOpen={modalType === 'card'}
        onClose={() => setModalType(null)}
        title="Novo cartão"
        size="md"
      >
        <AddCardForm
          onSubmit={handleAddCard}
          onCancel={() => setModalType(null)}
          isLoading={isCreatingCard}
        />
      </Modal>

      <Modal
        isOpen={modalType === 'cardPurchase'}
        onClose={() => {
          setModalType(null)
          setSelectedCardId(undefined)
        }}
        title="Nova compra no cartão"
        size="md"
      >
        <AddCardPurchaseForm
          onSubmit={handleAddCardPurchase}
          onCancel={() => {
            setModalType(null)
            setSelectedCardId(undefined)
          }}
          isLoading={isCreatingPurchase}
          initialCardId={selectedCardId}
        />
      </Modal>

      <Modal
        isOpen={modalType === 'goal'}
        onClose={() => setModalType(null)}
        title="Nova meta"
        size="md"
      >
        <AddGoalForm
          onSubmit={handleAddGoal}
          onCancel={() => setModalType(null)}
          isLoading={isCreatingGoal}
          initialData={{
            current_amount: totalInvestments > 0 ? totalInvestments : undefined,
          }}
        />
      </Modal>

      <Modal
        isOpen={modalType === 'category'}
        onClose={() => setModalType(null)}
        title="Nova categoria"
        size="md"
      >
        <AddCategoryForm
          onSubmit={handleAddCategory}
          onCancel={() => setModalType(null)}
          isLoading={isCreatingCategory}
        />
      </Modal>

      <Modal
        isOpen={modalType === 'recurringExpense'}
        onClose={() => {
          setModalType(null)
          setEditingRecurringExpense(null)
        }}
        title={editingRecurringExpense ? 'Editar despesa recorrente' : 'Nova despesa recorrente'}
        size="md"
      >
        <AddRecurringExpenseForm
          onSubmit={handleAddRecurringExpense}
          onCancel={() => {
            setModalType(null)
            setEditingRecurringExpense(null)
          }}
          isLoading={isCreatingRecurringExpense || isUpdatingRecurringExpense}
          initialData={editingRecurringExpense ? {
            name: editingRecurringExpense.name,
            amount: editingRecurringExpense.amount,
            due_day: editingRecurringExpense.due_day,
            category_id: editingRecurringExpense.category_id || undefined,
            account_id: editingRecurringExpense.account_id || undefined,
            description: editingRecurringExpense.description || undefined,
          } : undefined}
        />
      </Modal>

      {/* Modal de detalhes do cartão */}
      {selectedCardForModal && (
        <CardDetailsModal
          card={cards.find(c => c.id === selectedCardForModal)!}
          isOpen={!!selectedCardForModal}
          onClose={() => setSelectedCardForModal(null)}
          onPurchaseAdded={() => {
            // Invalida queries para atualizar dados
            // O React Query já faz isso automaticamente via onSuccess
          }}
        />
      )}

      {/* Modal de despesas do mês */}
      {(() => {
        const currentMonthName = new Date(currentYear, currentMonth - 1, 1).toLocaleDateString('pt-BR', {
          month: 'long',
          year: 'numeric',
        })
        
        const currentMonthExpenses = transactions.filter(transaction => {
          const transactionDate = parseLocalDate(transaction.date)
          return (
            transaction.type === 'expense' &&
            transactionDate.getMonth() + 1 === currentMonth &&
            transactionDate.getFullYear() === currentYear
          )
        })

        return (
          <MonthlyExpensesModal
            isOpen={showMonthlyExpenses}
            onClose={() => setShowMonthlyExpenses(false)}
            expenses={currentMonthExpenses}
            categories={categories}
            monthName={currentMonthName}
            totalAmount={monthlyExpenses}
            cardInvoices={currentMonthInvoicesForDisplay}
            recurringExpensesList={currentMonthRecurringExpensesList}
            cards={cards}
          />
        )
      })()}

      {/* Modal de resumo do patrimônio em contas */}
      <Modal
        isOpen={showTotalMoneyModal}
        onClose={() => setShowTotalMoneyModal(false)}
        title="Resumo do valor total"
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-card-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-label font-medium text-neutral-700 dark:text-neutral-300">Valor total</span>
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totalRealWealth)}
              </span>
            </div>
            <p className="text-caption text-neutral-600 dark:text-neutral-400">
              Soma do saldo atual em todas as contas. Receitas sem conta do mês atual e anterior são vinculadas automaticamente para &quot;Banco Inter - Salario&quot;.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-card border border-border dark:border-border-dark">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <span className="text-xl">📒</span>
                </div>
                <div>
                  <p className="text-body-sm font-medium text-neutral-950 dark:text-neutral-50">Soma nas contas</p>
                  <p className="text-caption text-neutral-600 dark:text-neutral-400">Saldo atual em todas as contas</p>
                </div>
              </div>
              <span className="text-body font-bold text-neutral-950 dark:text-neutral-50">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(sumOfAccounts)}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-card border border-border dark:border-border-dark">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                  <span className="text-xl">🏦</span>
                </div>
                <div>
                  <p className="text-body-sm font-medium text-neutral-950 dark:text-neutral-50">Contas líquidas</p>
                  <p className="text-caption text-neutral-600 dark:text-neutral-400">Corrente, caixa e carteira (sem investimentos)</p>
                </div>
              </div>
              <span className="text-body font-bold text-neutral-950 dark:text-neutral-50">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(liquidAccountsBalance)}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-card border border-border dark:border-border-dark">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-warning-100 dark:bg-warning-900 flex items-center justify-center">
                  <span className="text-xl">📈</span>
                </div>
                <div>
                  <p className="text-body-sm font-medium text-neutral-950 dark:text-neutral-50">Total investido</p>
                  <p className="text-caption text-neutral-600 dark:text-neutral-400">Soma de todas as contas de investimento</p>
                </div>
              </div>
              <span className="text-body font-bold text-neutral-950 dark:text-neutral-50">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totalInvestments)}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-card border border-border dark:border-border-dark">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success-100 dark:bg-success-900 flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
                <div>
                  <p className="text-body-sm font-medium text-neutral-950 dark:text-neutral-50">Sobra prevista</p>
                  <p className="text-caption text-neutral-600 dark:text-neutral-400">Receitas - Despesas do mês atual</p>
                </div>
              </div>
              <span className={`text-body font-bold ${expectedSurplus >= 0 ? 'text-success-600 dark:text-success-500' : 'text-danger-600 dark:text-danger-400'}`}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  signDisplay: 'always',
                }).format(expectedSurplus)}
              </span>
            </div>

            <div className="pt-4 border-t border-border dark:border-border-dark">
              <p className="text-caption text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Para manter o valor total fiel ao que existe nas contas, sempre que possivel vincule receitas e despesas a uma conta ao lancar.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Toast de notificação */}
      <Toast
        message={toast?.message || ''}
        type={toast?.type || 'info'}
        isVisible={!!toast}
        onClose={() => setToast(null)}
      />
    </div>
  )
}

