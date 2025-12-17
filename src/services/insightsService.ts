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

DADOS DO MÊS ATUAL (${data.monthName}):
- Receitas: R$ ${data.income.toFixed(2)}
- Despesas: R$ ${data.expenses.toFixed(2)}
- Saldo: R$ ${data.balance.toFixed(2)}
- Investimentos: R$ ${data.investments.toFixed(2)}
- Sobra prevista: R$ ${data.expectedSurplus.toFixed(2)}

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
1. Comparação com mês anterior
2. Alertas sobre despesas altas do próximo mês
3. Oportunidades de economia
4. Saúde financeira geral

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
      return insights.map((insight: any) => ({
        type: insight.type || 'info',
        title: insight.title || '',
        message: insight.message || '',
        suggestion: insight.suggestion
      }))
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

  // Insight sobre sobra prevista
  if (data.expectedSurplus < 0) {
    insights.push({
      type: 'danger',
      title: 'Atenção: Saldo Negativo',
      message: `Sua sobra prevista é negativa em R$ ${Math.abs(data.expectedSurplus).toFixed(2)}`,
      suggestion: 'Revise suas despesas e considere reduzir gastos não essenciais'
    })
  } else if (data.expectedSurplus > 0) {
    insights.push({
      type: 'success',
      title: 'Ótimo! Saldo Positivo',
      message: `Você terá uma sobra de R$ ${data.expectedSurplus.toFixed(2)} este mês`,
      suggestion: 'Considere investir parte desse valor'
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




