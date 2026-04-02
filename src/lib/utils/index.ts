// Formatação de moeda
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Formatação de data
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj)
}

// Formatação de data e hora
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj)
}

/** Parse date string (YYYY-MM-DD ou ISO) como data local, evitando problemas de fuso */
export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date(NaN)
  }
  // Só a parte da data (Supabase costuma devolver ISO com hora; split por T/- quebrava o dia)
  const datePart = dateStr.length >= 10 ? dateStr.slice(0, 10) : dateStr
  const parts = datePart.split('-').map(Number)
  const y = parts[0]
  const m = (parts[1] || 1) - 1
  const d = parts[2] || 1
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return new Date(NaN)
  }
  return new Date(y, m, d)
}

// Obter início do mês
export const getStartOfMonth = (date: Date = new Date()): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

// Obter fim do mês
export const getEndOfMonth = (date: Date = new Date()): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

// Calcular diferença em dias
export const getDaysDifference = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Classe condicional
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ')
}











