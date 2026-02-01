// Categorias padrão
export const DEFAULT_CATEGORIES = [
  { name: 'Alimentação', icon: '🍔', color: '#FF6B6B' },
  { name: 'Transporte', icon: '🚗', color: '#4ECDC4' },
  { name: 'Moradia', icon: '🏠', color: '#45B7D1' },
  { name: 'Saúde', icon: '🏥', color: '#96CEB4' },
  { name: 'Educação', icon: '📚', color: '#FFEAA7' },
  { name: 'Lazer', icon: '🎬', color: '#DDA0DD' },
  { name: 'Compras', icon: '🛍️', color: '#F39C12' },
  { name: 'Salário', icon: '💰', color: '#2ECC71' },
  { name: 'Freelance', icon: '💼', color: '#3498DB' },
  { name: 'Investimentos', icon: '📈', color: '#9B59B6' },
] as const

// Tipos de conta
export const ACCOUNT_TYPES = ['checking', 'savings', 'investment'] as const

// Tipos de transação
export const TRANSACTION_TYPES = ['income', 'expense'] as const

// Taxa SELIC anual (% a.a.) - atualize conforme o BCB
// Fonte: https://www.bcb.gov.br/estabilidadefinanceira/selic
export const SELIC_ANNUAL_RATE = 10.5

// Meses
export const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const











