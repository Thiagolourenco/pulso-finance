import { z } from 'zod'

// Validação de transação
export const transactionSchema = z.object({
  account_id: z.string().nullable(),
  card_id: z.string().nullable(),
  category_id: z.string().min(1, 'Categoria é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  type: z.enum(['income', 'expense']),
  date: z.string().min(1, 'Data é obrigatória'),
})

export type TransactionFormData = z.infer<typeof transactionSchema>

// Validação de conta
export const accountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['checking', 'savings', 'investment']),
  balance: z.number().min(0, 'Saldo não pode ser negativo'),
  bank_name: z.string().optional(),
})

export type AccountFormData = z.infer<typeof accountSchema>

// Validação de cartão
export const cardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  last_four: z.string().length(4, 'Últimos 4 dígitos são obrigatórios'),
  brand: z.string().min(1, 'Bandeira é obrigatória'),
  limit: z.number().positive('Limite deve ser positivo'),
  closing_day: z.number().min(1).max(31),
  due_day: z.number().min(1).max(31),
})

export type CardFormData = z.infer<typeof cardSchema>

// Validação de categoria
export const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['expense', 'income'], {
    message: 'Tipo deve ser "expense" ou "income"',
  }),
  icon: z.string().optional(),
  color: z.string().optional(),
  parent_id: z.string().nullable().optional(),
})

export type CategoryFormData = z.infer<typeof categorySchema>

// Validação de meta
export const goalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  target_amount: z.number().positive('Valor alvo deve ser positivo'),
  current_amount: z.number().min(0).default(0),
  target_date: z.string().optional(),
})

export type GoalFormData = z.infer<typeof goalSchema>

// Validação de login
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// Validação de registro
export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
})

export type RegisterFormData = z.infer<typeof registerSchema>

