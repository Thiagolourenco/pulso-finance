import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CategorySpendingList } from '@/components/budget/CategorySpendingList'
import {
  calculateCategorySpending,
  getCategoryMonthlyComparison,
  getCategorySpendingItems,
  getLastMonths,
  type CategoryMonthTotal,
} from '@/lib/utils/categorySpending'
import type { CardPurchase, Category, RecurringExpense, Transaction } from '@/types'

type ComparisonRange = '3months' | '6months' | '12months'

interface CategoryComparisonSectionProps {
  categories: Category[]
  transactions: Transaction[]
  cardPurchases: CardPurchase[]
  recurringExpenses: RecurringExpense[]
  chartAxisStroke: string
  chartGridStroke: string
  tooltipContentStyle: React.CSSProperties
  tooltipLabelStyle: React.CSSProperties
  tooltipItemStyle: React.CSSProperties
}

const RANGE_OPTIONS: { key: ComparisonRange; label: string; months: number }[] = [
  { key: '3months', label: '3 meses', months: 3 },
  { key: '6months', label: '6 meses', months: 6 },
  { key: '12months', label: '12 meses', months: 12 },
]

export const CategoryComparisonSection = ({
  categories,
  transactions,
  cardPurchases,
  recurringExpenses,
  chartAxisStroke,
  chartGridStroke,
  tooltipContentStyle,
  tooltipLabelStyle,
  tooltipItemStyle,
}: CategoryComparisonSectionProps) => {
  const expenseCategories = useMemo(
    () => categories.filter(category => category.type === 'expense').sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [categories]
  )

  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [comparisonRange, setComparisonRange] = useState<ComparisonRange>('6months')
  const [selectedMonthKey, setSelectedMonthKey] = useState('')

  useEffect(() => {
    if (!selectedCategoryId && expenseCategories.length > 0) {
      setSelectedCategoryId(expenseCategories[0].id)
    }
  }, [expenseCategories, selectedCategoryId])

  const selectedCategory = expenseCategories.find(category => category.id === selectedCategoryId) ?? null
  const rangeMonths = RANGE_OPTIONS.find(option => option.key === comparisonRange)?.months ?? 6

  const monthsInRange = useMemo(() => getLastMonths(rangeMonths), [rangeMonths])

  const monthlyData = useMemo(() => {
    if (!selectedCategoryId) return []

    return getCategoryMonthlyComparison(
      selectedCategoryId,
      transactions,
      cardPurchases,
      recurringExpenses,
      monthsInRange
    )
  }, [selectedCategoryId, transactions, cardPurchases, recurringExpenses, monthsInRange])

  useEffect(() => {
    if (monthlyData.length === 0) {
      setSelectedMonthKey('')
      return
    }

    const latest = monthlyData[monthlyData.length - 1]
    setSelectedMonthKey(`${latest.year}-${latest.month}`)
  }, [selectedCategoryId, comparisonRange, monthlyData])

  const selectedMonthData = useMemo(() => {
    if (!selectedMonthKey) return null
    const [year, month] = selectedMonthKey.split('-').map(Number)
    if (!year || !month) return null
    return { year, month }
  }, [selectedMonthKey])

  const selectedMonthItems = useMemo(() => {
    if (!selectedCategoryId || !selectedMonthData) return []

    return getCategorySpendingItems(
      selectedCategoryId,
      transactions,
      cardPurchases,
      recurringExpenses,
      selectedMonthData.month,
      selectedMonthData.year
    )
  }, [selectedCategoryId, selectedMonthData, transactions, cardPurchases, recurringExpenses])

  const selectedMonthSpent = useMemo(() => {
    if (!selectedCategoryId || !selectedMonthData) return 0

    return calculateCategorySpending(
      selectedCategoryId,
      transactions,
      cardPurchases,
      recurringExpenses,
      selectedMonthData.month,
      selectedMonthData.year
    )
  }, [selectedCategoryId, selectedMonthData, transactions, cardPurchases, recurringExpenses])

  const selectedMonthLabel = useMemo(() => {
    if (!selectedMonthData) return ''
    return new Date(selectedMonthData.year, selectedMonthData.month - 1, 1).toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    })
  }, [selectedMonthData])

  const summary = useMemo(() => {
    if (monthlyData.length === 0) {
      return {
        current: 0,
        previous: 0,
        changePercent: 0,
        average: 0,
        periodTotal: 0,
        bestMonth: null as CategoryMonthTotal | null,
        worstMonth: null as CategoryMonthTotal | null,
      }
    }

    const current = monthlyData[monthlyData.length - 1]
    const previous = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null
    const average = monthlyData.reduce((sum, entry) => sum + entry.amount, 0) / monthlyData.length
    const changePercent =
      previous && previous.amount > 0
        ? ((current.amount - previous.amount) / previous.amount) * 100
        : current.amount > 0
          ? 100
          : 0

    const withSpending = monthlyData.filter(entry => entry.amount > 0)
    const bestMonth =
      withSpending.length > 0
        ? withSpending.reduce((min, entry) => (entry.amount < min.amount ? entry : min))
        : null
    const worstMonth =
      withSpending.length > 0
        ? withSpending.reduce((max, entry) => (entry.amount > max.amount ? entry : max))
        : null

    return {
      current: current.amount,
      previous: previous?.amount ?? 0,
      changePercent,
      average,
      periodTotal: monthlyData.reduce((sum, entry) => sum + entry.amount, 0),
      bestMonth,
      worstMonth,
    }
  }, [monthlyData])

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })

  const formatChartValue = (value: number) => {
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`
    return `R$ ${value.toFixed(0)}`
  }

  if (expenseCategories.length === 0) return null

  return (
    <div className="mb-8">
      <div className="p-6 bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl rounded-card-lg border border-border dark:border-border-dark/70">
        <div className="mb-6">
          <h2 className="text-h3 font-semibold text-neutral-900 dark:text-neutral-50">
            Análise por Categoria
          </h2>
          <p className="text-body-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Filtre uma categoria para comparar gastos entre meses e ver o que aconteceu em cada período
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-caption font-medium text-neutral-600 dark:text-neutral-300 mb-2">
              Categoria
            </label>
            <select
              value={selectedCategoryId}
              onChange={(event) => setSelectedCategoryId(event.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border dark:border-border-dark bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {expenseCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon ? `${category.icon} ` : ''}{category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-caption font-medium text-neutral-600 dark:text-neutral-300 mb-2">
              Período de comparação
            </label>
            <div className="flex gap-2">
              {RANGE_OPTIONS.map(option => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setComparisonRange(option.key)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    comparisonRange === option.key
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-border dark:border-border-dark hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedCategory && (
          <div className="mb-6 p-4 rounded-lg border border-border dark:border-border-dark bg-neutral-50 dark:bg-neutral-900/30">
            <div className="flex items-center gap-3">
              {selectedCategory.icon && <span className="text-2xl">{selectedCategory.icon}</span>}
              <div>
                <p className="text-body font-semibold text-neutral-900 dark:text-neutral-50">
                  {selectedCategory.name}
                </p>
                <p className="text-caption text-neutral-500 dark:text-neutral-400">
                  Comparando os últimos {rangeMonths} meses
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="p-4 rounded-lg border border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-950/30 sm:col-span-2 lg:col-span-1">
            <p className="text-caption text-primary-700 dark:text-primary-300 mb-1">
              Total em {rangeMonths} {rangeMonths === 1 ? 'mês' : 'meses'}
            </p>
            <p className="text-h3 font-bold text-primary-700 dark:text-primary-300">
              R$ {formatCurrency(summary.periodTotal)}
            </p>
            <p className="text-caption text-primary-600/80 dark:text-primary-400/80 mt-1">
              Soma de todos os gastos no período
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border dark:border-border-dark bg-neutral-50 dark:bg-neutral-900/30">
            <p className="text-caption text-neutral-500 dark:text-neutral-400 mb-1">Último mês</p>
            <p className="text-body font-bold text-danger-600 dark:text-danger-400">
              R$ {formatCurrency(summary.current)}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border dark:border-border-dark bg-neutral-50 dark:bg-neutral-900/30">
            <p className="text-caption text-neutral-500 dark:text-neutral-400 mb-1">Mês anterior</p>
            <p className="text-body font-bold text-neutral-900 dark:text-neutral-50">
              R$ {formatCurrency(summary.previous)}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border dark:border-border-dark bg-neutral-50 dark:bg-neutral-900/30">
            <p className="text-caption text-neutral-500 dark:text-neutral-400 mb-1">Variação</p>
            <p
              className={`text-body font-bold ${
                summary.changePercent <= 0
                  ? 'text-success-600 dark:text-success-400'
                  : 'text-danger-600 dark:text-danger-400'
              }`}
            >
              {summary.changePercent > 0 ? '+' : ''}
              {summary.changePercent.toFixed(1)}%
            </p>
            <p className="text-caption text-neutral-500 dark:text-neutral-400 mt-1">
              {summary.changePercent <= 0 ? 'Melhoria' : 'Aumento'} vs mês anterior
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border dark:border-border-dark bg-neutral-50 dark:bg-neutral-900/30">
            <p className="text-caption text-neutral-500 dark:text-neutral-400 mb-1">Média no período</p>
            <p className="text-body font-bold text-neutral-900 dark:text-neutral-50">
              R$ {formatCurrency(summary.average)}
            </p>
          </div>
        </div>

        {(summary.bestMonth || summary.worstMonth) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {summary.bestMonth && (
              <div className="p-4 rounded-lg border border-border dark:border-border-dark bg-neutral-50 dark:bg-neutral-900/30 border-l-4 border-l-success-500">
                <p className="text-caption text-neutral-500 dark:text-neutral-400 mb-1">Menor gasto no período</p>
                <p className="text-body-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  {summary.bestMonth.monthLabel}
                </p>
                <p className="text-body font-bold text-success-600 dark:text-success-400 mt-1">
                  R$ {formatCurrency(summary.bestMonth.amount)}
                </p>
              </div>
            )}
            {summary.worstMonth && (
              <div className="p-4 rounded-lg border border-border dark:border-border-dark bg-neutral-50 dark:bg-neutral-900/30 border-l-4 border-l-danger-500">
                <p className="text-caption text-neutral-500 dark:text-neutral-400 mb-1">Maior gasto no período</p>
                <p className="text-body-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  {summary.worstMonth.monthLabel}
                </p>
                <p className="text-body font-bold text-danger-600 dark:text-danger-400 mt-1">
                  R$ {formatCurrency(summary.worstMonth.amount)}
                </p>
              </div>
            )}
          </div>
        )}

        {monthlyData.length > 0 ? (
          <div className="mb-6">
            <h3 className="text-body font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
              Evolução mensal
            </h3>
            <p className="text-caption text-neutral-500 dark:text-neutral-400 mb-4">
              Clique em um mês para ver os gastos detalhados
            </p>
            <ResponsiveContainer width="100%" height={rangeMonths > 6 ? 320 : 280}>
              <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: 0, bottom: rangeMonths > 6 ? 24 : 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                <XAxis
                  dataKey="monthLabel"
                  stroke={chartAxisStroke}
                  tick={{ fill: chartAxisStroke, fontSize: rangeMonths > 6 ? 11 : 13 }}
                  interval={0}
                  angle={rangeMonths > 6 ? -35 : 0}
                  textAnchor={rangeMonths > 6 ? 'end' : 'middle'}
                  height={rangeMonths > 6 ? 56 : undefined}
                />
                <YAxis
                  stroke={chartAxisStroke}
                  tick={{ fill: chartAxisStroke, fontSize: 12 }}
                  tickFormatter={formatChartValue}
                />
                <Tooltip
                  formatter={(value: number | undefined) =>
                    `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  }
                  contentStyle={tooltipContentStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                />
                <Bar
                  dataKey="amount"
                  name="Gasto"
                  radius={[8, 8, 0, 0]}
                  onClick={(data) => {
                    const barData = data as { year?: number; month?: number }
                    if (barData.year && barData.month) {
                      setSelectedMonthKey(`${barData.year}-${barData.month}`)
                    }
                  }}
                >
                  {monthlyData.map(entry => {
                    const isSelected = selectedMonthKey === `${entry.year}-${entry.month}`
                    return (
                      <Cell
                        key={`${entry.year}-${entry.month}`}
                        fill={isSelected ? '#EF4444' : '#F59E0B'}
                        style={{ cursor: 'pointer' }}
                      />
                    )
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mb-6 p-8 text-center text-neutral-500 dark:text-neutral-400 border border-dashed border-border dark:border-border-dark rounded-lg">
            Nenhum gasto encontrado para esta categoria no período
          </div>
        )}

        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="text-body font-semibold text-neutral-900 dark:text-neutral-50">
              Detalhes do mês
            </h3>
            <select
              value={selectedMonthKey}
              onChange={(event) => setSelectedMonthKey(event.target.value)}
              className="px-3 py-2 rounded-lg border border-border dark:border-border-dark bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {monthlyData.map(entry => (
                <option key={`${entry.year}-${entry.month}`} value={`${entry.year}-${entry.month}`}>
                  {entry.monthLabel} — R$ {entry.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </option>
              ))}
            </select>
          </div>

          {selectedMonthData && (
            <>
              {(() => {
                const selectedEntry = monthlyData.find(
                  entry => entry.year === selectedMonthData.year && entry.month === selectedMonthData.month
                )
                if (!selectedEntry || selectedEntry.changePercent === null) return null

                return (
                  <p className="text-body-sm text-neutral-600 dark:text-neutral-300 mb-4">
                    {selectedEntry.changePercent <= 0 ? '↓' : '↑'}{' '}
                    {Math.abs(selectedEntry.changePercent).toFixed(1)}% em relação ao mês anterior
                    {selectedEntry.changePercent <= 0 ? ' — você gastou menos' : ' — você gastou mais'}
                  </p>
                )
              })()}

              <CategorySpendingList
                items={selectedMonthItems}
                monthSpent={selectedMonthSpent}
                monthLabel={selectedMonthLabel}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
