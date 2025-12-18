import { useEffect, useMemo, useRef, useState } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import { useCards } from '@/hooks/useCards'
import { useCardInvoices } from '@/hooks/useCardInvoices'
import { useCardPurchases } from '@/hooks/useCardPurchases'
import { useCategories } from '@/hooks/useCategories'
import { useRecurringExpenses } from '@/hooks/useRecurringExpenses'
import { PieChart, Pie, Cell, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Button } from '@/components/ui'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

export const Reports = () => {
  const { transactions, isLoading: isLoadingTransactions } = useTransactions()
  const { isLoading: isLoadingAccounts } = useAccounts()
  const { cards, isLoading: isLoadingCards } = useCards()
  const { invoices, isLoading: isLoadingInvoices } = useCardInvoices()
  const { isLoading: isLoadingPurchases } = useCardPurchases()
  const { categories, isLoading: isLoadingCategories } = useCategories()
  const { expenses: recurringExpenses, isLoading: isLoadingRecurring } = useRecurringExpenses()

  const [selectedPeriod, setSelectedPeriod] = useState<'month' | '3months' | '6months' | 'year'>('month')
  const reportRef = useRef<HTMLDivElement | null>(null)
  const [pdfHint, setPdfHint] = useState<string>('')

  const isMobile = useMemo(() => {
    if (typeof navigator === 'undefined') return false
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  }, [])

  useEffect(() => {
    const after = () => {
      document.documentElement.classList.remove('print-mode')
    }
    window.addEventListener('afterprint', after)
    return () => window.removeEventListener('afterprint', after)
  }, [])

  const isLoading = isLoadingTransactions || isLoadingAccounts || isLoadingCards || isLoadingInvoices || isLoadingPurchases || isLoadingCategories || isLoadingRecurring

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  // Calcula o período baseado na seleção
  const periodData = useMemo(() => {
    // Último dia do mês atual às 23:59:59
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999)
    let startDate = new Date()

    switch (selectedPeriod) {
      case 'month':
        startDate = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0, 0)
        break
      case '3months':
        startDate = new Date(currentYear, currentMonth - 4, 1, 0, 0, 0, 0)
        break
      case '6months':
        startDate = new Date(currentYear, currentMonth - 7, 1, 0, 0, 0, 0)
        break
      case 'year':
        startDate = new Date(currentYear - 1, currentMonth - 1, 1, 0, 0, 0, 0)
        break
    }

    return { startDate, endDate }
  }, [selectedPeriod, currentMonth, currentYear])

  // Comparativo mês atual vs anterior
  const monthComparison = useMemo(() => {
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear

    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date)
      return (
        transactionDate.getMonth() + 1 === currentMonth &&
        transactionDate.getFullYear() === currentYear
      )
    })

    const previousMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date)
      return (
        transactionDate.getMonth() + 1 === previousMonth &&
        transactionDate.getFullYear() === previousYear
      )
    })

    const currentIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

    const previousIncome = previousMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

    const currentExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0)

    const previousExpenses = previousMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0)

    return {
      current: { income: currentIncome, expenses: currentExpenses },
      previous: { income: previousIncome, expenses: previousExpenses },
      incomeChange: previousIncome > 0 ? ((currentIncome - previousIncome) / previousIncome) * 100 : 0,
      expensesChange: previousExpenses > 0 ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 : 0,
    }
  }, [transactions, currentMonth, currentYear])

  // Gastos por categoria
  const expensesByCategory = useMemo(() => {
    const categoryMap = new Map<string, { name: string; amount: number; color: string; icon?: string }>()

    transactions
      .filter(t => {
        const transactionDate = new Date(t.date)
        transactionDate.setHours(0, 0, 0, 0)
        const start = new Date(periodData.startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(periodData.endDate)
        end.setHours(23, 59, 59, 999)
        return (
          t.type === 'expense' &&
          transactionDate >= start &&
          transactionDate <= end
        )
      })
      .forEach(transaction => {
        const category = categories.find(c => c.id === transaction.category_id)
        const categoryName = category?.name || 'Sem categoria'
        const amount = Math.abs(Number(transaction.amount) || 0)

        if (categoryMap.has(categoryName)) {
          const existing = categoryMap.get(categoryName)!
          categoryMap.set(categoryName, {
            ...existing,
            amount: existing.amount + amount
          })
        } else {
          categoryMap.set(categoryName, {
            name: categoryName,
            amount,
            color: category?.color || '#64748B',
            icon: category?.icon ?? undefined
          })
        }
      })

    return Array.from(categoryMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8)
  }, [transactions, categories, periodData])

  // Receitas por categoria
  const incomeByCategory = useMemo(() => {
    const categoryMap = new Map<string, { name: string; amount: number; color: string }>()

    transactions
      .filter(t => {
        const transactionDate = new Date(t.date)
        transactionDate.setHours(0, 0, 0, 0)
        const start = new Date(periodData.startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(periodData.endDate)
        end.setHours(23, 59, 59, 999)
        return (
          t.type === 'income' &&
          transactionDate >= start &&
          transactionDate <= end
        )
      })
      .forEach(transaction => {
        const category = categories.find(c => c.id === transaction.category_id)
        const categoryName = category?.name || 'Sem categoria'
        const amount = Number(transaction.amount) || 0

        if (categoryMap.has(categoryName)) {
          const existing = categoryMap.get(categoryName)!
          categoryMap.set(categoryName, {
            ...existing,
            amount: existing.amount + amount
          })
        } else {
          categoryMap.set(categoryName, {
            name: categoryName,
            amount,
            color: category?.color || '#64748B'
          })
        }
      })

    return Array.from(categoryMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [transactions, categories, periodData])

  // Evolução mensal de receitas e despesas
  const monthlyEvolution = useMemo(() => {
    const months: { [key: string]: { month: string; receitas: number; despesas: number; saldo: number } } = {}

    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date)
      transactionDate.setHours(0, 0, 0, 0)
      const start = new Date(periodData.startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(periodData.endDate)
      end.setHours(23, 59, 59, 999)
      if (transactionDate < start || transactionDate > end) return

      const monthKey = `${transactionDate.getMonth() + 1}/${transactionDate.getFullYear()}`
      const monthName = transactionDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })

      if (!months[monthKey]) {
        months[monthKey] = { month: monthName, receitas: 0, despesas: 0, saldo: 0 }
      }

      if (transaction.type === 'income') {
        months[monthKey].receitas += Number(transaction.amount) || 0
        months[monthKey].saldo += Number(transaction.amount) || 0
      } else if (transaction.type === 'expense') {
        months[monthKey].despesas += Math.abs(Number(transaction.amount) || 0)
        months[monthKey].saldo -= Math.abs(Number(transaction.amount) || 0)
      }
    })

    return Object.values(months).sort((a, b) => {
      const [monthA, yearA] = a.month.split('/')
      const [monthB, yearB] = b.month.split('/')
      return new Date(parseInt(yearA), parseInt(monthA) - 1).getTime() - new Date(parseInt(yearB), parseInt(monthB) - 1).getTime()
    })
  }, [transactions, periodData])

  // Gastos por dia da semana
  const expensesByDayOfWeek = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const dayMap = new Map<number, number>()

    transactions
      .filter(t => {
        const transactionDate = new Date(t.date)
        transactionDate.setHours(0, 0, 0, 0)
        const start = new Date(periodData.startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(periodData.endDate)
        end.setHours(23, 59, 59, 999)
        return (
          t.type === 'expense' &&
          transactionDate >= start &&
          transactionDate <= end
        )
      })
      .forEach(transaction => {
        const day = new Date(transaction.date).getDay()
        const amount = Math.abs(Number(transaction.amount) || 0)
        dayMap.set(day, (dayMap.get(day) || 0) + amount)
      })

    return days.map((day, index) => ({
      dia: day,
      gasto: dayMap.get(index) || 0
    }))
  }, [transactions, periodData])

  // Gastos por semana do mês (semana 1, 2, 3, 4)
  const expensesByWeekOfMonth = useMemo(() => {
    const weekMap = new Map<number, number>()

    transactions
      .filter(t => {
        const transactionDate = new Date(t.date)
        transactionDate.setHours(0, 0, 0, 0)
        const start = new Date(periodData.startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(periodData.endDate)
        end.setHours(23, 59, 59, 999)
        return (
          t.type === 'expense' &&
          transactionDate >= start &&
          transactionDate <= end
        )
      })
      .forEach(transaction => {
        const transactionDate = new Date(transaction.date)
        const dayOfMonth = transactionDate.getDate()
        const week = Math.ceil(dayOfMonth / 7)
        const amount = Math.abs(Number(transaction.amount) || 0)
        weekMap.set(week, (weekMap.get(week) || 0) + amount)
      })

    return [1, 2, 3, 4].map(week => ({
      semana: `Semana ${week}`,
      gasto: weekMap.get(week) || 0
    }))
  }, [transactions, periodData])

  // Dia do mês que mais gasta
  const expensesByDayOfMonth = useMemo(() => {
    const dayMap = new Map<number, { count: number; amount: number }>()

    transactions
      .filter(t => {
        const transactionDate = new Date(t.date)
        transactionDate.setHours(0, 0, 0, 0)
        const start = new Date(periodData.startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(periodData.endDate)
        end.setHours(23, 59, 59, 999)
        return (
          t.type === 'expense' &&
          transactionDate >= start &&
          transactionDate <= end
        )
      })
      .forEach(transaction => {
        const day = new Date(transaction.date).getDate()
        const amount = Math.abs(Number(transaction.amount) || 0)
        const existing = dayMap.get(day) || { count: 0, amount: 0 }
        dayMap.set(day, {
          count: existing.count + 1,
          amount: existing.amount + amount
        })
      })

    const sorted = Array.from(dayMap.entries())
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 5)

    return sorted.map(([day, data]) => ({
      dia: `Dia ${day}`,
      gasto: data.amount,
      transacoes: data.count
    }))
  }, [transactions, periodData])

  // Faturas de cartão por mês
  const cardInvoicesByMonth = useMemo(() => {
    const monthMap = new Map<string, number>()

    invoices
      .filter(invoice => {
        const invoiceDate = new Date(invoice.due_date)
        invoiceDate.setHours(0, 0, 0, 0)
        const start = new Date(periodData.startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(periodData.endDate)
        end.setHours(23, 59, 59, 999)
        return invoiceDate >= start && invoiceDate <= end
      })
      .forEach(invoice => {
        const invoiceDate = new Date(invoice.due_date)
        const monthKey = invoiceDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
        const amount = invoice.total_amount || 0
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + amount)
      })

    return Array.from(monthMap.entries())
      .map(([month, total]) => ({ mes: month, total }))
      .sort((a, b) => {
        const [monthA, yearA] = a.mes.split('/')
        const [monthB, yearB] = b.mes.split('/')
        return new Date(parseInt(yearA), parseInt(monthA) - 1).getTime() - new Date(parseInt(yearB), parseInt(monthB) - 1).getTime()
      })
  }, [invoices, periodData])

  // Comparativo de cartões
  const cardsComparison = useMemo(() => {
    return cards.map(card => {
      const cardInvoices = invoices.filter(inv => inv.card_id === card.id)
      const openInvoices = cardInvoices.filter(inv => inv.status === 'open')
      const totalOpen = openInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
      const usagePercentage = card.credit_limit > 0 ? (totalOpen / card.credit_limit) * 100 : 0

      return {
        name: card.name,
        limit: card.credit_limit,
        used: totalOpen,
        available: card.credit_limit - totalOpen,
        usage: usagePercentage,
        invoices: cardInvoices.length
      }
    }).sort((a, b) => b.used - a.used)
  }, [cards, invoices])

  // Análise de despesas recorrentes
  const recurringExpensesAnalysis = useMemo(() => {
    const active = recurringExpenses.filter(e => e.is_active)
    const total = active.reduce((sum, e) => sum + (e.amount || 0), 0)

    return {
      count: active.length,
      total,
      average: active.length > 0 ? total / active.length : 0,
      expenses: active.map(e => ({
        name: e.name,
        amount: e.amount,
        due_day: e.due_day
      })).sort((a, b) => b.amount - a.amount)
    }
  }, [recurringExpenses])

  // Top 5 transações
  const topTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const transactionDate = new Date(t.date)
        transactionDate.setHours(0, 0, 0, 0)
        const start = new Date(periodData.startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(periodData.endDate)
        end.setHours(23, 59, 59, 999)
        return transactionDate >= start && transactionDate <= end
      })
      .map(transaction => {
        const category = categories.find(c => c.id === transaction.category_id)
        return {
          ...transaction,
          categoryName: category?.name || 'Sem categoria',
          amountValue: Math.abs(Number(transaction.amount) || 0)
        }
      })
      .sort((a, b) => b.amountValue - a.amountValue)
      .slice(0, 5)
  }, [transactions, categories, periodData])

  // Resumo geral
  const summary = useMemo(() => {
    const periodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date)
      transactionDate.setHours(0, 0, 0, 0)
      const start = new Date(periodData.startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(periodData.endDate)
      end.setHours(23, 59, 59, 999)
      return transactionDate >= start && transactionDate <= end
    })

    const totalIncome = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

    const totalExpenses = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0)

    const totalBalance = totalIncome - totalExpenses

    return { totalIncome, totalExpenses, totalBalance, transactionCount: periodTransactions.length }
  }, [transactions, periodData])

  // Função para exportar dados
  const handleExport = () => {
    const data = {
      periodo: selectedPeriod,
      resumo: summary,
      comparativo: monthComparison,
      categorias: expensesByCategory,
      receitas: incomeByCategory,
      topTransacoes: topTransactions,
      exportadoEm: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Exporta como PDF via print (usuário salva/compartilha como PDF)
  const handleExportPdf = () => {
    // Ativa modo de impressão para esconder sidebar/header e focar no relatório
    document.documentElement.classList.add('print-mode')

    if (isMobile) {
      setPdfHint('No celular: na tela de impressão, use “Compartilhar” ou “Salvar como PDF”.')
      setTimeout(() => setPdfHint(''), 5000)
    }

    // Aguarda um tick para aplicar classes antes do print
    setTimeout(() => {
      window.print()
    }, 50)
  }

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-body text-neutral-500">Carregando relatórios...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in" ref={reportRef}>
      {/* Header */}
      <div className="no-print mb-6 lg:mb-8 pb-4 lg:pb-6 border-b border-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-h1 font-bold text-neutral-900 dark:text-neutral-50 mb-1 lg:mb-2">
              Relatórios
            </h1>
            <p className="text-sm lg:text-body-sm text-neutral-500 dark:text-neutral-400">
              Análise detalhada das suas finanças
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {/* Seletor de período - mobile com scroll horizontal */}
            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {([
                { key: 'month', label: 'Mês' },
                { key: '3months', label: '3 Meses' },
                { key: '6months', label: '6 Meses' },
                { key: 'year', label: 'Ano' },
              ] as const).map((p) => (
                <button
                  key={p.key}
                  onClick={() => setSelectedPeriod(p.key)}
                  className={`
                    flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${selectedPeriod === p.key
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 border border-border dark:border-border-dark hover:bg-neutral-50 dark:hover:bg-neutral-800'}
                  `}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Export */}
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleExportPdf} variant="secondary" className="w-full justify-center">
                {isMobile ? '📤 PDF' : '🖨️ PDF'}
              </Button>
              <Button onClick={handleExport} variant="secondary" className="w-full justify-center">
                📥 JSON
              </Button>
            </div>
          </div>
        </div>
      </div>

      {pdfHint && (
        <div className="no-print mb-4 p-3 rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 text-sm">
          {pdfHint}
        </div>
      )}

      {/* Resumo geral */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="p-4 lg:p-6 bg-white dark:bg-neutral-950 rounded-card-lg border border-border dark:border-border-dark">
          <p className="text-caption text-neutral-600 mb-2">Total de Receitas</p>
          <p className="text-h2 font-bold text-success-600">
            R$ {summary.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          {monthComparison.incomeChange !== 0 && (
            <p className={`text-caption mt-1 ${monthComparison.incomeChange >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {monthComparison.incomeChange >= 0 ? '↑' : '↓'} {Math.abs(monthComparison.incomeChange).toFixed(1)}% vs mês anterior
            </p>
          )}
        </div>
        <div className="p-4 lg:p-6 bg-white dark:bg-neutral-950 rounded-card-lg border border-border dark:border-border-dark">
          <p className="text-caption text-neutral-600 mb-2">Total de Despesas</p>
          <p className="text-h2 font-bold text-danger-600">
            R$ {summary.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          {monthComparison.expensesChange !== 0 && (
            <p className={`text-caption mt-1 ${monthComparison.expensesChange <= 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {monthComparison.expensesChange <= 0 ? '↓' : '↑'} {Math.abs(monthComparison.expensesChange).toFixed(1)}% vs mês anterior
            </p>
          )}
        </div>
        <div className="p-4 lg:p-6 bg-white dark:bg-neutral-950 rounded-card-lg border border-border dark:border-border-dark">
          <p className="text-caption text-neutral-600 mb-2">Saldo</p>
          <p className={`text-h2 font-bold ${summary.totalBalance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
            {summary.totalBalance >= 0 ? '+' : ''}R$ {summary.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-4 lg:p-6 bg-white dark:bg-neutral-950 rounded-card-lg border border-border dark:border-border-dark">
          <p className="text-caption text-neutral-600 mb-2">Transações</p>
          <p className="text-h2 font-bold text-neutral-900">
            {summary.transactionCount}
          </p>
        </div>
      </div>

      {/* Comparativo Mês Atual vs Anterior */}
      {selectedPeriod === 'month' && (
        <div className="mb-8">
          <div className="p-6 bg-white rounded-card-lg border border-border">
            <h2 className="text-h3 font-semibold text-neutral-900 mb-4">Comparativo: Mês Atual vs Anterior</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                {
                  periodo: 'Mês Anterior',
                  receitas: monthComparison.previous.income,
                  despesas: monthComparison.previous.expenses
                },
                {
                  periodo: 'Mês Atual',
                  receitas: monthComparison.current.income,
                  despesas: monthComparison.current.expenses
                }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="periodo" stroke="#64748B" />
                <YAxis stroke="#64748B" />
                <Tooltip
                  formatter={(value: number | undefined) => `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
                <Legend />
                <Bar dataKey="receitas" fill="#10B981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="despesas" fill="#EF4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gastos por Categoria */}
        <div className="p-6 bg-white rounded-card-lg border border-border">
          <h2 className="text-h3 font-semibold text-neutral-900 mb-4">Gastos por Categoria</h2>
          {expensesByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.name || ''} ${((props.percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {expensesByCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | undefined) => `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-neutral-500">
              <p>Nenhum dado disponível para o período selecionado</p>
            </div>
          )}
        </div>

        {/* Receitas por Categoria */}
        {incomeByCategory.length > 0 && (
          <div className="p-6 bg-white rounded-card-lg border border-border">
            <h2 className="text-h3 font-semibold text-neutral-900 mb-4">Receitas por Categoria</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incomeByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#64748B" />
                <YAxis stroke="#64748B" />
                <Tooltip
                  formatter={(value: number | undefined) => `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
                <Bar dataKey="amount" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Evolução Mensal */}
        <div className="p-6 bg-white rounded-card-lg border border-border">
          <h2 className="text-h3 font-semibold text-neutral-900 mb-4">Evolução Mensal</h2>
          {monthlyEvolution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#64748B" />
                <YAxis stroke="#64748B" />
                <Tooltip
                  formatter={(value: number | undefined) => `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
                <Legend />
                <Area type="monotone" dataKey="receitas" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Receitas" />
                <Area type="monotone" dataKey="despesas" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Despesas" />
                <Line type="monotone" dataKey="saldo" stroke="#3B82F6" strokeWidth={2} name="Saldo" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-neutral-500">
              <p>Nenhum dado disponível para o período selecionado</p>
            </div>
          )}
        </div>

        {/* Gastos por Dia da Semana */}
        <div className="p-6 bg-white rounded-card-lg border border-border">
          <h2 className="text-h3 font-semibold text-neutral-900 mb-4">Gastos por Dia da Semana</h2>
          {expensesByDayOfWeek.some(d => d.gasto > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expensesByDayOfWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="dia" stroke="#64748B" />
                <YAxis stroke="#64748B" />
                <Tooltip
                  formatter={(value: number | undefined) => `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
                <Bar dataKey="gasto" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-neutral-500">
              <p>Nenhum dado disponível para o período selecionado</p>
            </div>
          )}
        </div>

        {/* Gastos por Semana do Mês */}
        {selectedPeriod === 'month' && (
          <div className="p-6 bg-white rounded-card-lg border border-border">
            <h2 className="text-h3 font-semibold text-neutral-900 mb-4">Gastos por Semana do Mês</h2>
            {expensesByWeekOfMonth.some(w => w.gasto > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={expensesByWeekOfMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="semana" stroke="#64748B" />
                  <YAxis stroke="#64748B" />
                  <Tooltip
                    formatter={(value: number | undefined) => `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  />
                  <Bar dataKey="gasto" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-neutral-500">
                <p>Nenhum dado disponível</p>
              </div>
            )}
          </div>
        )}

        {/* Faturas de Cartão */}
        <div className="p-6 bg-white rounded-card-lg border border-border">
          <h2 className="text-h3 font-semibold text-neutral-900 mb-4">Faturas de Cartão</h2>
          {cardInvoicesByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cardInvoicesByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="mes" stroke="#64748B" />
                <YAxis stroke="#64748B" />
                <Tooltip
                  formatter={(value: number | undefined) => `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
                <Bar dataKey="total" fill="#F59E0B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-neutral-500">
              <p>Nenhuma fatura disponível para o período selecionado</p>
            </div>
          )}
        </div>
      </div>

      {/* Análises Adicionais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Comparativo de Cartões */}
        {cardsComparison.length > 0 && (
          <div className="p-6 bg-white rounded-card-lg border border-border">
            <h2 className="text-h3 font-semibold text-neutral-900 mb-4">Uso dos Cartões</h2>
            <div className="space-y-4">
              {cardsComparison.map((card, index) => (
                <div key={index} className="p-4 bg-neutral-50 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-body font-semibold text-neutral-900">{card.name}</h3>
                    <span className={`text-caption font-medium ${
                      card.usage > 80 ? 'text-danger-600' :
                      card.usage > 50 ? 'text-warning-600' :
                      'text-success-600'
                    }`}>
                      {card.usage.toFixed(0)}% usado
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        card.usage > 80 ? 'bg-danger-600' :
                        card.usage > 50 ? 'bg-warning-600' :
                        'bg-success-600'
                      }`}
                      style={{ width: `${Math.min(card.usage, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-caption text-neutral-600">
                    <span>Usado: R$ {card.used.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span>Disponível: R$ {card.available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Despesas Recorrentes */}
        {recurringExpensesAnalysis.count > 0 && (
          <div className="p-6 bg-white rounded-card-lg border border-border">
            <h2 className="text-h3 font-semibold text-neutral-900 mb-4">Despesas Recorrentes</h2>
            <div className="mb-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <div className="flex items-center justify-between">
                <p className="text-caption text-neutral-600">Total Mensal</p>
                <p className="text-h3 font-bold text-primary-600">
                  R$ {recurringExpensesAnalysis.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <p className="text-caption text-neutral-500 mt-1">
                {recurringExpensesAnalysis.count} despesas ativas • Média: R$ {recurringExpensesAnalysis.average.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="space-y-2">
              {recurringExpensesAnalysis.expenses.slice(0, 5).map((expense, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="text-body-sm font-medium text-neutral-900">{expense.name}</p>
                    <p className="text-caption text-neutral-500">Vence dia {expense.due_day}</p>
                  </div>
                  <p className="text-body font-semibold text-danger-600">
                    R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top 5 Dias que Mais Gasta */}
        {expensesByDayOfMonth.length > 0 && selectedPeriod === 'month' && (
          <div className="p-6 bg-white rounded-card-lg border border-border">
            <h2 className="text-h3 font-semibold text-neutral-900 mb-4">Dias que Mais Gasta</h2>
            <div className="space-y-3">
              {expensesByDayOfMonth.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-border">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-body font-bold text-primary-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-body-sm font-medium text-neutral-900">{day.dia}</p>
                      <p className="text-caption text-neutral-500">{day.transacoes} transações</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-body font-bold text-danger-600">
                      R$ {day.gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top 5 Transações */}
      <div className="mb-8">
        <div className="p-6 bg-white rounded-card-lg border border-border">
          <h2 className="text-h3 font-semibold text-neutral-900 mb-4">Top 5 Transações</h2>
          {topTransactions.length > 0 ? (
            <div className="space-y-3">
              {topTransactions.map((transaction, index) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-body font-bold text-primary-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-body-sm font-medium text-neutral-900">{transaction.description}</p>
                      <p className="text-caption text-neutral-500">
                        {transaction.categoryName} • {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-body font-bold ${transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amountValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              <p>Nenhuma transação disponível para o período selecionado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
