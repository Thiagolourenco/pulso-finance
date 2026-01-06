import { useState, useEffect } from 'react'
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
  const { invoices, updateInvoice, isUpdating: isUpdatingInvoice } = useCardInvoices()
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

  // Calcula receitas do mês atual (transações do tipo 'income')
  const monthlyIncome = transactions
    .filter(transaction => {
      const transactionDate = new Date(transaction.date)
      return (
        transaction.type === 'income' &&
        transactionDate.getMonth() + 1 === currentMonth &&
        transactionDate.getFullYear() === currentYear
      )
    })
    .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0)

  // Calcula receitas do mês anterior
  const previousMonthIncome = transactions
    .filter(transaction => {
      const transactionDate = new Date(transaction.date)
      return (
        transaction.type === 'income' &&
        transactionDate.getMonth() + 1 === previousMonth &&
        transactionDate.getFullYear() === previousYear
      )
    })
    .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0)

  // Calcula despesas do mês atual (transações do tipo 'expense')
  const transactionExpenses = transactions
    .filter(transaction => {
      const transactionDate = new Date(transaction.date)
      return (
        transaction.type === 'expense' &&
        transactionDate.getMonth() + 1 === currentMonth &&
        transactionDate.getFullYear() === currentYear
      )
    })
    .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount) || 0), 0)

  // Inclui faturas de cartão que vencem no mês atual (mesmo que pagas) como despesas
  const currentMonthInvoices = invoices.filter(invoice => {
    const invoiceDueDate = new Date(invoice.due_date)
    invoiceDueDate.setHours(0, 0, 0, 0)
    const invoiceMonth = invoiceDueDate.getMonth() + 1
    const invoiceYear = invoiceDueDate.getFullYear()
    
    // Inclui todas as faturas (abertas e pagas) que vencem no mês atual
    const isCurrentMonth = invoiceMonth === currentMonth && invoiceYear === currentYear
    
    // Também inclui faturas vencidas que ainda estão abertas
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isOverdue = invoiceDueDate <= today && invoice.status === 'open'
    
    return isCurrentMonth || (isOverdue && invoice.total_amount > 0)
  })
  const currentMonthInvoiceTotal = currentMonthInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0)

  // Calcula despesas recorrentes ativas que vencem no mês atual (mesmo que pagas)
  const currentMonthRecurringExpenses = recurringExpenses
    .filter(expense => {
      if (!expense.is_active) return false
      
      // Calcula a data de vencimento no mês atual baseado no dia de vencimento
      const dueDate = new Date(currentYear, currentMonth - 1, expense.due_day)
      
      // Verifica se o vencimento é no mês atual (independente de já ter passado ou não)
      return dueDate.getMonth() + 1 === currentMonth && dueDate.getFullYear() === currentYear
    })
    .reduce((sum, expense) => sum + (expense.amount || 0), 0)

  // Despesas do mês = transações + faturas + despesas recorrentes que vencem no mês atual
  const monthlyExpenses = transactionExpenses + currentMonthInvoiceTotal + currentMonthRecurringExpenses

  // Calcula despesas do mês anterior (transações do tipo 'expense')
  const previousMonthTransactionExpenses = transactions
    .filter(transaction => {
      const transactionDate = new Date(transaction.date)
      return (
        transaction.type === 'expense' &&
        transactionDate.getMonth() + 1 === previousMonth &&
        transactionDate.getFullYear() === previousYear
      )
    })
    .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount) || 0), 0)

  // Inclui faturas de cartão que venceram no mês anterior (mesmo que pagas)
  const previousMonthInvoices = invoices.filter(invoice => {
    const invoiceDueDate = new Date(invoice.due_date)
    const invoiceMonth = invoiceDueDate.getMonth() + 1
    const invoiceYear = invoiceDueDate.getFullYear()
    return invoiceMonth === previousMonth && invoiceYear === previousYear
  })
  const previousMonthInvoiceTotal = previousMonthInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0)

  // Calcula despesas recorrentes ativas que venceram no mês anterior (mesmo que pagas)
  const previousMonthRecurringExpenses = recurringExpenses
    .filter(expense => {
      if (!expense.is_active) return false
      
      // Calcula o vencimento do mês anterior baseado no dia de vencimento
      const prevMonthDate = new Date(previousYear, previousMonth - 1, expense.due_day)
      
      // Verifica se o vencimento foi no mês anterior
      return prevMonthDate.getMonth() + 1 === previousMonth && prevMonthDate.getFullYear() === previousYear
    })
    .reduce((sum, expense) => sum + (expense.amount || 0), 0)

  // Despesas do mês anterior = transações + faturas + despesas recorrentes que venceram no mês anterior
  const previousMonthExpenses = previousMonthTransactionExpenses + previousMonthInvoiceTotal + previousMonthRecurringExpenses

  // Calcula o total de investimentos
  const investmentAccounts = accounts.filter(account => account.type === 'investment')
  const totalInvestments = investmentAccounts.reduce((sum, account) => {
    const balance = Number(account.current_balance) || 0
    return sum + balance
  }, 0)

  // Calcula sobra prevista (receitas - despesas do mês atual)
  const expectedSurplus = monthlyIncome - monthlyExpenses
  
  // Calcula sobra do mês anterior
  const previousMonthSurplus = previousMonthIncome - previousMonthExpenses
  
  // Total do dinheiro = Total investido + Sobra prevista do mês atual + Sobra do mês anterior
  const totalBalance = totalInvestments + expectedSurplus + previousMonthSurplus

  // Também calcula saldo a partir das transações (para comparação)
  const balanceFromTransactions = transactions.reduce((sum, transaction) => {
    if (transaction.type === 'income') {
      return sum + (Number(transaction.amount) || 0)
    } else if (transaction.type === 'expense') {
      return sum - Math.abs(Number(transaction.amount) || 0)
    }
    return sum
  }, 0)

  console.log('💰 Saldo calculado:', {
    fromAccounts: totalBalance,
    fromTransactions: balanceFromTransactions,
    difference: totalBalance - balanceFromTransactions,
  })
  
  // Calcula variação percentual da sobra
  const surplusVariation = previousMonthSurplus !== 0
    ? ((expectedSurplus - previousMonthSurplus) / Math.abs(previousMonthSurplus)) * 100
    : 0


  // Debug: log para verificar os dados
  console.log('📊 Dashboard Debug:', {
    totalTransactions: transactions.length,
    currentMonth: `${currentMonth}/${currentYear}`,
    previousMonth: `${previousMonth}/${previousYear}`,
    monthlyIncome,
    previousMonthIncome,
    monthlyExpenses,
    previousMonthExpenses,
    expectedSurplus,
    previousMonthSurplus,
    surplusVariation: `${surplusVariation.toFixed(2)}%`,
    totalBalance,
    totalInvestments,
    totalAccounts: accounts.length,
    accounts: accounts.map(acc => ({ 
      name: acc.name, 
      type: acc.type, 
      current_balance: acc.current_balance,
      initial_balance: acc.initial_balance,
    })),
  })

  const handleAddTransaction = async (data: {
    description: string
    amount: number
    type: 'expense' | 'income' | 'balance'
    date: string
    category_id?: string
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
          account_id: null,
          category_id: categoryId,
          type: data.type,
          amount: Math.abs(data.amount),
          description: data.description,
          date: data.date,
        }, {
          onSuccess: () => {
            setToast({ 
              message: data.type === 'income' 
                ? 'Receita adicionada com sucesso!' 
                : 'Gasto adicionado com sucesso!', 
              type: 'success' 
            })
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
    type: 'checking' | 'savings' | 'investment'
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
        type: data.type === 'checking' ? 'bank' : data.type === 'savings' ? 'cash' : 'investment',
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 lg:mb-8 pb-4 lg:pb-6 border-b border-border">
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
        {/* Linha superior: Receitas, Saldo e Investimentos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <FinancialCard
            title="Receitas do mês"
            value={monthlyIncome}
            subtitle="Este mês"
            variant="success"
            icon={
              <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            }
          />
          <FinancialCard
            title="Total do dinheiro"
            value={totalBalance}
            subtitle="Contas + Investimentos"
            variant="purple"
            icon={
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <span className="text-2xl">💵</span>
              </div>
            }
            onClick={() => setShowTotalMoneyModal(true)}
            className="cursor-pointer"
          />
          {/* Investimentos - oculto no mobile quando não expandido */}
          <div className={showAllCards ? 'block' : 'hidden lg:block'}>
            <FinancialCard
              title="Investimentos"
              value={totalInvestments}
              subtitle="Total investido"
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
            subtitle="Este mês"
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
              const transactionDate = new Date(transaction.date)
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
            balance: totalBalance,
            investments: totalInvestments,
            nextMonthExpenses: (() => {
              const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
              const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear
              const nextMonthTransactions = transactions.filter(transaction => {
                const transactionDate = new Date(transaction.date)
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

        <div className="bg-gradient-to-br from-white to-neutral-50 rounded-card-lg p-6 border border-border shadow-card hover:shadow-card-hover transition-all duration-fast">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <h2 className="text-h3 font-semibold text-neutral-900">Saúde do mês</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded-lg border border-border dark:border-neutral-700">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📈</span>
                  <span className="text-body-sm text-neutral-600">Sobra prevista</span>
                </div>
                {previousMonthSurplus !== 0 && (
                  <span className={`text-caption ml-7 ${
                    surplusVariation >= 0 ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {surplusVariation >= 0 ? '↑' : '↓'} {Math.abs(surplusVariation).toFixed(1)}% vs mês anterior
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-body font-bold ${
                  expectedSurplus >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {expectedSurplus >= 0 ? '+' : ''}R$ {expectedSurplus.toLocaleString('pt-BR', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </span>
                {previousMonthSurplus !== 0 && (
                  <span className="text-caption text-neutral-500">
                    Mês anterior: R$ {previousMonthSurplus.toLocaleString('pt-BR', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded-lg border border-border dark:border-neutral-700">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💰</span>
                  <span className="text-body-sm text-neutral-600">Receitas</span>
                </div>
                {previousMonthIncome > 0 && (
                  <span className={`text-caption ml-7 ${
                    monthlyIncome >= previousMonthIncome ? 'text-success-600' : 'text-danger-600'
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
                <span className="text-body font-bold text-success-600">
                  R$ {monthlyIncome.toLocaleString('pt-BR', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </span>
                {previousMonthIncome > 0 && (
                  <span className="text-caption text-neutral-500">
                    Mês anterior: R$ {previousMonthIncome.toLocaleString('pt-BR', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded-lg border border-border dark:border-neutral-700">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💸</span>
                  <span className="text-body-sm text-neutral-600">Despesas</span>
                </div>
                {previousMonthExpenses > 0 && (
                  <span className={`text-caption ml-7 ${
                    monthlyExpenses <= previousMonthExpenses ? 'text-success-600' : 'text-danger-600'
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
                <span className="text-body font-bold text-danger-600">
                  R$ {monthlyExpenses.toLocaleString('pt-BR', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </span>
                {previousMonthExpenses > 0 && (
                  <span className="text-caption text-neutral-500">
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
            <h2 className="text-h3 font-semibold text-neutral-900">Minhas Metas</h2>
            <button
              onClick={() => navigate('/goals')}
              className="text-body-sm text-primary-600 hover:text-primary-700 font-medium"
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
                className="text-body-sm text-primary-600 hover:text-primary-700 font-medium"
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
            <h2 className="text-h3 font-semibold text-neutral-900">Financiamentos e Despesas Recorrentes</h2>
            <button
              onClick={() => {
                setEditingRecurringExpense(null)
                setModalType('recurringExpense')
              }}
              className="text-body-sm text-primary-600 hover:text-primary-700 font-medium"
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
            <h2 className="text-h3 font-semibold text-neutral-900">Financiamentos e Despesas Recorrentes</h2>
            <button
              onClick={() => {
                setEditingRecurringExpense(null)
                setModalType('recurringExpense')
              }}
              className="text-body-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              + Adicionar
            </button>
          </div>
          <div className="p-8 bg-neutral-50 rounded-lg border border-border text-center">
            <p className="text-body-sm text-neutral-500 mb-4">
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
          <h2 className="text-h3 font-semibold text-neutral-900 mb-4">Meus cartões</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => {
              const cardInvoices = invoices.filter(inv => inv.card_id === card.id)
              // Busca a última fatura (aberta ou paga) - prioriza aberta, mas mostra paga também
              const openInvoice = cardInvoices.find(inv => inv.status === 'open')
              const paidInvoice = cardInvoices.find(inv => inv.status === 'paid')
              // Usa a fatura aberta se existir, senão usa a paga
              const currentInvoice = openInvoice || paidInvoice
              // Busca a última fatura para mostrar informações quando não há fatura atual
              const lastInvoice = cardInvoices.sort((a, b) => 
                new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
              )[0]
              const cardPurchases = purchases.filter(p => p.card_id === card.id)
              const activePurchases = cardPurchases.filter(p => p.current_installment < p.installments)
              const invoiceTotal = currentInvoice?.total_amount || 0
              const availableLimit = card.credit_limit - invoiceTotal

              return (
                <div
                  key={card.id}
                  onClick={() => setSelectedCardForModal(card.id)}
                  className="p-5 bg-white rounded-card-lg border-2 border-border hover:border-primary-400 hover:shadow-lg cursor-pointer transition-all duration-fast"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">💳</span>
                      <h3 className="text-body font-semibold text-neutral-900">{card.name}</h3>
                    </div>
                    {currentInvoice && (() => {
                      const invoiceDueDate = new Date(currentInvoice.due_date)
                      const invoiceMonth = invoiceDueDate.getMonth() + 1
                      const invoiceDay = invoiceDueDate.getDate()
                      
                      const today = new Date()
                      const todayDay = today.getDate()
                      
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
                        <span className={`px-2 py-1 text-caption font-semibold rounded-full border ${badgeColor}`}>
                          {badgeText}
                        </span>
                      )
                    })()}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-body-sm">
                      <span className="text-neutral-600">Limite:</span>
                      <span className="font-medium text-neutral-900">
                        R$ {card.credit_limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    {currentInvoice ? (() => {
                      const isPaid = currentInvoice.status === 'paid'
                      
                      return (
                        <>
                          <div className="flex justify-between text-body-sm">
                            <span className="text-neutral-600">Fatura atual:</span>
                            <span className="font-bold text-danger-600">
                              R$ {invoiceTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between text-body-sm">
                            <span className="text-neutral-600">Disponível:</span>
                            <span className="font-medium text-success-600">
                              R$ {availableLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-caption text-neutral-500 mt-2 pt-2 border-t border-border">
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
                                onChange={(e) => {
                                  e.stopPropagation()
                                  updateInvoice(
                                    { 
                                      id: currentInvoice.id, 
                                      data: { status: e.target.checked ? 'paid' : 'open' } 
                                    },
                                    {
                                      onSuccess: () => {
                                        // Invalida queries para atualizar a UI imediatamente
                                        queryClient.invalidateQueries({ queryKey: ['card_invoices'] })
                                        setToast({ 
                                          message: e.target.checked 
                                            ? 'Fatura marcada como paga' 
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
                        <div className="text-caption text-neutral-500">
                          Nenhuma fatura aberta
                        </div>
                        {lastInvoice && (
                          <div className="text-caption text-neutral-400 pt-2 border-t border-border">
                            Última fatura: {lastInvoice.status === 'paid' ? 'Paga' : lastInvoice.status === 'closed' ? 'Fechada' : 'Aberta'} 
                            {lastInvoice.due_date && ` • Venceu em ${new Date(lastInvoice.due_date).toLocaleDateString('pt-BR')}`}
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
          const transactionDate = new Date(transaction.date)
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
          />
        )
      })()}

      {/* Modal de resumo do Total do dinheiro */}
      <Modal
        isOpen={showTotalMoneyModal}
        onClose={() => setShowTotalMoneyModal(false)}
        title="Resumo do Total do dinheiro"
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-card-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-label font-medium text-neutral-700 dark:text-neutral-300">Total do dinheiro</span>
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totalBalance)}
              </span>
            </div>
            <p className="text-caption text-neutral-600 dark:text-neutral-400">Soma dos investimentos + sobra prevista</p>
          </div>

          <div className="space-y-4">
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
                  <p className="text-caption text-neutral-600 dark:text-neutral-400">Receitas - Despesas do mês</p>
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
              <div className="flex items-center justify-between text-caption text-neutral-600 dark:text-neutral-400 mb-2">
                <span>Receitas do mês</span>
                <span className="text-body-sm font-medium text-neutral-950 dark:text-neutral-50">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(monthlyIncome)}
                </span>
              </div>
              <div className="flex items-center justify-between text-caption text-neutral-600 dark:text-neutral-400">
                <span>Despesas do mês</span>
                <span className="text-body-sm font-medium text-neutral-950 dark:text-neutral-50">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(monthlyExpenses)}
                </span>
              </div>
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

