import { useState, useEffect } from 'react'
import { generateReportInsights, type ReportInsight, type ReportInsightsData } from '@/services/insightsService'

interface ReportInsightsProps {
  data: ReportInsightsData
}

const getTypeStyles = (type: ReportInsight['type']) => {
  switch (type) {
    case 'success':
      return 'bg-success-50 border-success-200 text-success-800 dark:bg-success-900/20 dark:border-success-700/50 dark:text-success-200'
    case 'warning':
      return 'bg-warning-50 border-warning-200 text-warning-800 dark:bg-warning-900/20 dark:border-warning-700/50 dark:text-warning-200'
    case 'danger':
      return 'bg-danger-50 border-danger-200 text-danger-800 dark:bg-danger-900/20 dark:border-danger-700/50 dark:text-danger-200'
    default:
      return 'bg-primary-50 border-primary-200 text-primary-800 dark:bg-primary-500/10 dark:border-primary-500/30 dark:text-primary-200'
  }
}

const getTypeIcon = (type: ReportInsight['type']) => {
  switch (type) {
    case 'success': return '✅'
    case 'warning': return '⚠️'
    case 'danger': return '🚨'
    default: return '💡'
  }
}

export const ReportInsights = ({ data }: ReportInsightsProps) => {
  const [insights, setInsights] = useState<ReportInsight[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      try {
        const result = await generateReportInsights(data)
        if (!cancelled) setInsights(result)
      } catch (error) {
        console.error('Erro ao carregar insights do relatório:', error)
        if (!cancelled) setInsights([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [data])

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl rounded-card-lg p-6 border border-border dark:border-border-dark/70">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h2 className="text-h3 font-semibold text-neutral-900 dark:text-neutral-50">Insights do relatório</h2>
            <p className="text-caption text-neutral-500 dark:text-neutral-400">Comparativo e pontos de melhoria</p>
          </div>
          {import.meta.env.VITE_OPENAI_API_KEY && (
            <span className="ml-auto px-2 py-1 bg-primary-100 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-caption font-medium rounded-full">
              IA
            </span>
          )}
        </div>
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          <span className="ml-3 text-body-sm text-neutral-600 dark:text-neutral-300">Gerando insights...</span>
        </div>
      </div>
    )
  }

  if (insights.length === 0) return null

  const comparativo = insights.filter(i => i.section === 'comparativo')
  const melhoria = insights.filter(i => i.section === 'melhoria')

  return (
    <div className="bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl rounded-card-lg p-6 border border-border dark:border-border-dark/70">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center">
          <span className="text-xl">🤖</span>
        </div>
        <div>
          <h2 className="text-h3 font-semibold text-neutral-900 dark:text-neutral-50">Insights do relatório</h2>
          <p className="text-caption text-neutral-500 dark:text-neutral-400">Comparativo e pontos de melhoria</p>
        </div>
        {import.meta.env.VITE_OPENAI_API_KEY && (
          <span className="ml-auto px-2 py-1 bg-primary-100 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-caption font-medium rounded-full">
            IA
          </span>
        )}
      </div>

      <div className="space-y-6">
        {comparativo.length > 0 && (
          <div>
            <h3 className="text-body font-semibold text-neutral-800 dark:text-neutral-200 mb-3 flex items-center gap-2">
              <span>📊</span> Comparativo
            </h3>
            <div className="space-y-3">
              {comparativo.map((insight, index) => (
                <div
                  key={`comp-${index}`}
                  className={`p-4 rounded-lg border-2 ${getTypeStyles(insight.type)} transition-all hover:shadow-md`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{getTypeIcon(insight.type)}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-body-sm font-semibold mb-1">{insight.title}</h4>
                      <p className="text-caption mb-2 opacity-90">{insight.message}</p>
                      {insight.suggestion && (
                        <p className="text-caption font-medium opacity-75">💡 {insight.suggestion}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {melhoria.length > 0 && (
          <div>
            <h3 className="text-body font-semibold text-neutral-800 dark:text-neutral-200 mb-3 flex items-center gap-2">
              <span>🎯</span> Pontos de melhoria
            </h3>
            <div className="space-y-3">
              {melhoria.map((insight, index) => (
                <div
                  key={`melhoria-${index}`}
                  className={`p-4 rounded-lg border-2 ${getTypeStyles(insight.type)} transition-all hover:shadow-md`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{getTypeIcon(insight.type)}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-body-sm font-semibold mb-1">{insight.title}</h4>
                      <p className="text-caption mb-2 opacity-90">{insight.message}</p>
                      {insight.suggestion && (
                        <p className="text-caption font-medium opacity-75">💡 {insight.suggestion}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
