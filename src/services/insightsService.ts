import { SELIC_ANNUAL_RATE } from '@/lib/constants'

interface MonthlyData {
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

interface Insight {
  type: 'warning' | 'success' | 'info' | 'danger'
  title: string
  message: string
  suggestion?: string
}

export const generateInsights = async (data: MonthlyData): Promise<Insight[]> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY

  if (!apiKey) {
    // Retorna insights básicos sem IA se não houver API key
    return generateBasicInsights(data)
  }

  try {
    const prompt = `Você é um assistente financeiro especializado. Analise os dados financeiros abaixo e gere insights práticos e acionáveis em português brasileiro.

PRIORIDADES: 1) Sempre inclua um insight de RESUMO DO MÊS com valor ganho (receitas), gastos (despesas) e sobra. 2) Se a pessoa tem investimentos > 0, inclua um insight positivo "Estamos lá!" celebrando e mostrando o valor investido. 3) Dê sugestões de "como melhorar" em cada insight.

DADOS DO MÊS ATUAL (${data.monthName}):
- Valor ganho (receitas): R$ ${data.income.toFixed(2)}
- Gastos (despesas): R$ ${data.expenses.toFixed(2)}
- Saldo total: R$ ${data.balance.toFixed(2)}
- Investimentos: R$ ${data.investments.toFixed(2)}
- Sobra do mês: R$ ${data.expectedSurplus.toFixed(2)}

DADOS DO MÊS ANTERIOR:
- Receitas: R$ ${data.previousMonthIncome.toFixed(2)}
- Despesas: R$ ${data.previousMonthExpenses.toFixed(2)}
- Sobra: R$ ${data.previousMonthSurplus.toFixed(2)}

DESPESAS PREVISTAS PARA O PRÓXIMO MÊS (${data.nextMonthName}):
- Despesas já registradas: R$ ${data.nextMonthExpenses.toFixed(2)}
- Parcelas fixas: R$ ${data.nextMonthFixedExpenses.toFixed(2)}
- Despesas recorrentes: R$ ${data.nextMonthRecurringExpenses.toFixed(2)}
- Faturas de cartão: R$ ${data.nextMonthInvoiceExpenses.toFixed(2)}
- TOTAL PREVISTO: R$ ${(data.nextMonthExpenses + data.nextMonthFixedExpenses + data.nextMonthRecurringExpenses + data.nextMonthInvoiceExpenses).toFixed(2)}

DESPESAS RECORRENTES:
${data.recurringExpenses.map(e => `- ${e.name}: R$ ${e.amount.toFixed(2)} (vence dia ${e.due_day})`).join('\n')}

PRINCIPAIS GASTOS:
${data.topExpenses.slice(0, 5).map(e => `- ${e.description}: R$ ${e.amount.toFixed(2)}${e.category ? ` (${e.category})` : ''}`).join('\n')}

Gere 3-5 insights em formato JSON array, cada um com:
- type: "warning" | "success" | "info" | "danger"
- title: título curto e direto
- message: mensagem explicativa (máximo 100 caracteres)
- suggestion: sugestão acionável opcional (máximo 80 caracteres)

Seja específico, use os valores reais e dê conselhos práticos. Foque em:
1. Resumo do mês: valor ganho, gastos e sobra (obrigatório)
2. Investimentos: celebre "Estamos lá!" se tiver valor investido, mostre progresso
3. Como melhorar: sugestões acionáveis em cada insight
4. Comparação com mês anterior e alertas do próximo mês

Retorne APENAS o JSON array, sem markdown, sem explicações adicionais.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente financeiro especializado. Retorne sempre JSON válido, sem markdown.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    })

    if (!response.ok) {
      throw new Error('Erro ao gerar insights')
    }

    const result = await response.json()
    const content = result.choices[0]?.message?.content

    if (!content) {
      throw new Error('Resposta vazia da API')
    }

    // Tenta extrair JSON da resposta
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const insights = JSON.parse(jsonMatch[0])
      const validTypes = ['warning', 'success', 'info', 'danger'] as const
      return insights.map((raw: Record<string, unknown>) => ({
        type: validTypes.includes(raw.type as typeof validTypes[number]) ? (raw.type as Insight['type']) : 'info',
        title: String(raw.title || ''),
        message: String(raw.message || ''),
        suggestion: raw.suggestion ? String(raw.suggestion) : undefined
      })) as Insight[]
    }

    // Se não conseguir extrair JSON, retorna insights básicos
    return generateBasicInsights(data)
  } catch (error) {
    console.error('Erro ao gerar insights com IA:', error)
    return generateBasicInsights(data)
  }
}

const generateBasicInsights = (data: MonthlyData): Insight[] => {
  const insights: Insight[] = []
  const totalNextMonth = data.nextMonthExpenses + data.nextMonthFixedExpenses + data.nextMonthRecurringExpenses + data.nextMonthInvoiceExpenses

  // 1. Resumo do mês (sempre primeiro) - valor ganho, gastos e sobra explícitos
  insights.push({
    type: data.expectedSurplus >= 0 ? 'success' : 'danger',
    title: `Resumo de ${data.monthName}`,
    message: `Valor ganho: R$ ${data.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • Gastos: R$ ${data.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • Sobra: R$ ${data.expectedSurplus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    suggestion: data.expectedSurplus >= 0
      ? 'Como melhorar: reserve pelo menos 10% da sobra antes de gastar com extras'
      : 'Como melhorar: corte gastos não essenciais e priorize o pagamento de dívidas'
  })

  // 2. Insight de investimento - "Estamos lá!"
  if (data.investments > 0) {
    const monthlyReturn = data.investments * (Math.pow(1 + SELIC_ANNUAL_RATE / 100, 1 / 12) - 1)
    insights.push({
      type: 'success',
      title: 'Estamos lá! Investindo',
      message: `Você tem R$ ${data.investments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} investidos. ~R$ ${monthlyReturn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês em rendimentos`,
      suggestion: 'Continue assim! Considere aumentar o aporte com parte da sobra mensal'
    })
  }

  // 3. Insight sobre sobra prevista (complementar ao resumo)
  if (data.expectedSurplus < 0) {
    insights.push({
      type: 'danger',
      title: 'Atenção: Saldo Negativo',
      message: `Sua sobra prevista é negativa em R$ ${Math.abs(data.expectedSurplus).toFixed(2)}`,
      suggestion: 'Revise suas despesas e considere reduzir gastos não essenciais'
    })
  } else if (data.expectedSurplus > 0 && data.investments === 0) {
    insights.push({
      type: 'success',
      title: 'Ótimo! Saldo Positivo',
      message: `Você terá uma sobra de R$ ${data.expectedSurplus.toFixed(2)} este mês`,
      suggestion: 'Considere investir parte desse valor para começar a crescer seu patrimônio'
    })
  }

  // Insight sobre próximo mês
  if (totalNextMonth > data.income * 0.8) {
    insights.push({
      type: 'warning',
      title: 'Próximo Mês com Alto Gasto',
      message: `Despesas previstas de R$ ${totalNextMonth.toFixed(2)} representam mais de 80% da receita`,
      suggestion: 'Planeje com antecedência e evite gastos extras'
    })
  }

  // Insight sobre comparação com mês anterior
  if (data.previousMonthExpenses > 0) {
    const expenseVariation = ((data.expenses - data.previousMonthExpenses) / data.previousMonthExpenses) * 100
    if (expenseVariation > 20) {
      insights.push({
        type: 'warning',
        title: 'Aumento Significativo de Gastos',
        message: `Suas despesas aumentaram ${expenseVariation.toFixed(1)}% em relação ao mês anterior`,
        suggestion: 'Analise onde houve o maior aumento'
      })
    } else if (expenseVariation < -10) {
      insights.push({
        type: 'success',
        title: 'Redução de Gastos',
        message: `Parabéns! Você reduziu ${Math.abs(expenseVariation).toFixed(1)}% suas despesas`,
        suggestion: 'Mantenha esse controle financeiro'
      })
    }
  }

  // Insight sobre despesas recorrentes
  if (data.recurringExpenses.length > 0) {
    const totalRecurring = data.recurringExpenses.reduce((sum, e) => sum + e.amount, 0)
    if (totalRecurring > data.income * 0.5) {
      insights.push({
        type: 'warning',
        title: 'Muitas Despesas Fixas',
        message: `Suas despesas recorrentes (R$ ${totalRecurring.toFixed(2)}) consomem mais de 50% da receita`,
        suggestion: 'Revise se todas são realmente necessárias'
      })
    }
  }

  return insights
}

// --- Insights do Relatório (comparativo + pontos de melhoria) ---

export interface ReportInsight {
  section: 'comparativo' | 'melhoria'
  type: 'warning' | 'success' | 'info' | 'danger'
  title: string
  message: string
  suggestion?: string
}

export interface ReportInsightsData {
  periodLabel: string
  summary: { totalIncome: number; totalExpenses: number; totalBalance: number; transactionCount: number }
  monthComparison: {
    current: { income: number; expenses: number }
    previous: { income: number; expenses: number }
    incomeChange: number
    expensesChange: number
  }
  monthlyEvolution: Array<{ month: string; receitas: number; despesas: number; saldo: number }>
  expensesByCategory: Array<{ name: string; amount: number }>
  incomeByCategory: Array<{ name: string; amount: number }>
  totalInvested: number
}

export const generateReportInsights = async (data: ReportInsightsData): Promise<ReportInsight[]> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY

  if (!apiKey) {
    return generateBasicReportInsights(data)
  }

  try {
    const evolutionText = data.monthlyEvolution
      .map(m => `${m.month}: receitas R$ ${m.receitas.toFixed(2)}, despesas R$ ${m.despesas.toFixed(2)}, saldo R$ ${m.saldo.toFixed(2)}`)
      .join('\n')
    const topCategories = data.expensesByCategory.slice(0, 5).map(c => `${c.name}: R$ ${c.amount.toFixed(2)}`).join('\n')

    const prompt = `Você é um analista financeiro. Com base nos dados do relatório abaixo, gere insights em português brasileiro.

PERÍODO: ${data.periodLabel}

RESUMO DO PERÍODO:
- Total receitas: R$ ${data.summary.totalIncome.toFixed(2)}
- Total despesas: R$ ${data.summary.totalExpenses.toFixed(2)}
- Saldo: R$ ${data.summary.totalBalance.toFixed(2)}
- Nº transações: ${data.summary.transactionCount}

COMPARATIVO MÊS ATUAL VS ANTERIOR:
- Receitas: variação ${data.monthComparison.incomeChange.toFixed(1)}%
- Despesas: variação ${data.monthComparison.expensesChange.toFixed(1)}%

EVOLUÇÃO POR MÊS (quando houver):
${evolutionText || 'N/A'}

TOP CATEGORIAS DE GASTO:
${topCategories || 'N/A'}

INVESTIMENTOS: R$ ${data.totalInvested.toFixed(2)}

Gere um JSON array com 4 a 8 insights. Para cada insight use:
- section: "comparativo" (análise do comparativo/evolução) OU "melhoria" (sugestão de melhoria)
- type: "success" | "warning" | "info" | "danger"
- title: título curto
- message: mensagem clara (até 120 caracteres)
- suggestion: opcional, dica acionável (até 80 caracteres)

Inclua pelo menos 2 insights de "comparativo" (tendências, comparações) e 2 de "melhoria" (o que o usuário pode fazer melhor). Seja específico com os números quando fizer sentido. Retorne APENAS o JSON array, sem markdown.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um analista financeiro. Retorne apenas um JSON array válido, sem markdown.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) throw new Error('Erro ao gerar insights do relatório')

    const result = await response.json()
    const content = result.choices[0]?.message?.content
    if (!content) throw new Error('Resposta vazia')

    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const raw = JSON.parse(jsonMatch[0]) as Array<Record<string, unknown>>
      const validTypes = ['warning', 'success', 'info', 'danger'] as const
      const validSections = ['comparativo', 'melhoria'] as const
      return raw.map((item): ReportInsight => ({
        section: validSections.includes((item.section as string) as typeof validSections[number]) ? (item.section as ReportInsight['section']) : 'comparativo',
        type: validTypes.includes((item.type as string) as typeof validTypes[number]) ? (item.type as ReportInsight['type']) : 'info',
        title: String(item.title || ''),
        message: String(item.message || ''),
        suggestion: item.suggestion ? String(item.suggestion) : undefined,
      }))
    }

    return generateBasicReportInsights(data)
  } catch (error) {
    console.error('Erro ao gerar insights do relatório (IA):', error)
    return generateBasicReportInsights(data)
  }
}

function generateBasicReportInsights(data: ReportInsightsData): ReportInsight[] {
  const insights: ReportInsight[] = []
  const { summary, monthComparison, monthlyEvolution, expensesByCategory, totalInvested } = data

  // --- Comparativo ---
  if (monthComparison.incomeChange !== 0) {
    insights.push({
      section: 'comparativo',
      type: monthComparison.incomeChange >= 0 ? 'success' : 'warning',
      title: 'Receitas vs mês anterior',
      message: `Suas receitas ${monthComparison.incomeChange >= 0 ? 'aumentaram' : 'diminuíram'} ${Math.abs(monthComparison.incomeChange).toFixed(1)}% em relação ao mês anterior.`,
      suggestion: monthComparison.incomeChange < 0 ? 'Revise fontes de renda e previsão de entradas.' : undefined,
    })
  }

  if (monthComparison.expensesChange !== 0) {
    insights.push({
      section: 'comparativo',
      type: monthComparison.expensesChange <= 0 ? 'success' : 'warning',
      title: 'Despesas vs mês anterior',
      message: `Despesas ${monthComparison.expensesChange <= 0 ? 'reduziram' : 'aumentaram'} ${Math.abs(monthComparison.expensesChange).toFixed(1)}% em relação ao mês anterior.`,
      suggestion: monthComparison.expensesChange > 15 ? 'Vale analisar as categorias que mais subiram.' : undefined,
    })
  }

  if (monthlyEvolution.length >= 2) {
    const lastSaldo = monthlyEvolution[monthlyEvolution.length - 1].saldo
    const firstSaldo = monthlyEvolution[0].saldo
    const saldoMelhorou = lastSaldo >= firstSaldo
    insights.push({
      section: 'comparativo',
      type: saldoMelhorou ? 'success' : 'info',
      title: 'Tendência do saldo no período',
      message: saldoMelhorou
        ? `O saldo no período manteve ou melhorou (de R$ ${firstSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para R$ ${lastSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`
        : `O saldo no período caiu. Compare os meses para identificar o que mudou.`,
      suggestion: saldoMelhorou ? 'Mantenha o controle para continuar evoluindo.' : 'Priorize reduzir despesas ou aumentar receitas.',
    })
  }

  if (summary.totalBalance >= 0) {
    insights.push({
      section: 'comparativo',
      type: 'success',
      title: 'Saldo do período',
      message: `Saldo positivo de R$ ${summary.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no período.`,
      suggestion: 'Considere reservar parte para reserva de emergência ou investimentos.',
    })
  } else {
    insights.push({
      section: 'comparativo',
      type: 'danger',
      title: 'Saldo negativo no período',
      message: `O período fechou com saldo negativo de R$ ${Math.abs(summary.totalBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      suggestion: 'Revise gastos e evite novos compromissos até reequilibrar.',
    })
  }

  // --- Pontos de melhoria ---
  if (expensesByCategory.length > 0) {
    const totalExp = expensesByCategory.reduce((s, c) => s + c.amount, 0)
    const top = expensesByCategory[0]
    const pct = totalExp > 0 ? (top.amount / totalExp) * 100 : 0
    if (pct > 35) {
      insights.push({
        section: 'melhoria',
        type: 'warning',
        title: 'Categoria com maior peso',
        message: `"${top.name}" representa ${pct.toFixed(0)}% dos gastos (R$ ${top.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`,
        suggestion: 'Defina um teto para essa categoria e acompanhe ao longo do mês.',
      })
    }
  }

  if (summary.totalIncome > 0 && summary.totalExpenses / summary.totalIncome > 0.9) {
    insights.push({
      section: 'melhoria',
      type: 'warning',
      title: 'Margem apertada',
      message: 'Despesas consomem mais de 90% das receitas no período.',
      suggestion: 'Tente reduzir gastos não essenciais ou aumentar a receita para ter mais folga.',
    })
  }

  if (totalInvested > 0) {
    insights.push({
      section: 'melhoria',
      type: 'info',
      title: 'Investimentos',
      message: `Você tem R$ ${totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} investidos.`,
      suggestion: 'Mantenha aportes regulares, mesmo que pequenos.',
    })
  } else if (summary.totalBalance > 500) {
    insights.push({
      section: 'melhoria',
      type: 'info',
      title: 'Próximo passo: investir',
      message: 'Há saldo positivo no período e ainda não há investimentos registrados.',
      suggestion: 'Considere abrir uma aplicação e começar com um valor fixo mensal.',
    })
  }

  return insights
}





