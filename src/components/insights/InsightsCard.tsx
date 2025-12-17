import { useState, useEffect } from 'react'
import { generateInsights } from '@/services/insightsService'

interface Insight {
  type: 'warning' | 'success' | 'info' | 'danger'
  title: string
  message: string
  suggestion?: string
}

interface InsightsCardProps {
  monthlyData: {
    income: number
    expenses: number
    balance: number
    investments: number
    nextMonthExpenses: number
    nextMonthFixedExpenses: number
    nextMonthRecurringExpenses: number
    nextMonthInvoiceExpenses: number
    previousMonthIncome: number
    previousMonthExpenses: number
    expectedSurplus: number
    previousMonthSurplus: number
    recurringExpenses: Array<{ name: string; amount: number; due_day: number }>
    topExpenses: Array<{ description: string; amount: number; category?: string }>
    monthName: string
    nextMonthName: string
  }
}

export const InsightsCard = ({ monthlyData }: InsightsCardProps) => {
  const [insights, setInsights] = useState<Insight[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadInsights = async () => {
      setIsLoading(true)
      try {
        const generatedInsights = await generateInsights(monthlyData)
        setInsights(generatedInsights)
      } catch (error) {
        console.error('Erro ao carregar insights:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadInsights()
  }, [monthlyData])

  const getTypeStyles = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return 'bg-success-50 border-success-200 text-success-800'
      case 'warning':
        return 'bg-warning-50 border-warning-200 text-warning-800'
      case 'danger':
        return 'bg-danger-50 border-danger-200 text-danger-800'
      default:
        return 'bg-primary-50 border-primary-200 text-primary-800'
    }
  }

  const getTypeIcon = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'danger':
        return '🚨'
      default:
        return '💡'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-card-lg p-6 border border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
            <span className="text-xl">🤖</span>
          </div>
          <h2 className="text-h3 font-semibold text-neutral-900">Insights Inteligentes</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-body-sm text-neutral-600">Gerando insights...</span>
        </div>
      </div>
    )
  }

  if (insights.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-card-lg p-6 border border-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
          <span className="text-xl">🤖</span>
        </div>
        <h2 className="text-h3 font-semibold text-neutral-900">Insights Inteligentes</h2>
        {import.meta.env.VITE_OPENAI_API_KEY && (
          <span className="px-2 py-1 bg-primary-100 text-primary-700 text-caption font-medium rounded-full">
            IA
          </span>
        )}
      </div>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-2 ${getTypeStyles(insight.type)} transition-all hover:shadow-md`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{getTypeIcon(insight.type)}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-body-sm font-semibold mb-1">{insight.title}</h3>
                <p className="text-caption mb-2 opacity-90">{insight.message}</p>
                {insight.suggestion && (
                  <p className="text-caption font-medium opacity-75">
                    💡 {insight.suggestion}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


