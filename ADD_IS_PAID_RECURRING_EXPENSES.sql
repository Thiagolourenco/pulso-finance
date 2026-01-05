-- ============================================
-- Migration: Adicionar campo is_paid_current_month na tabela recurring_expenses
-- ============================================

-- Adiciona a coluna is_paid_current_month na tabela recurring_expenses
ALTER TABLE recurring_expenses
ADD COLUMN IF NOT EXISTS is_paid_current_month BOOLEAN NOT NULL DEFAULT false;

-- Cria índice para melhorar performance em consultas que filtram por is_paid_current_month
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_is_paid_current_month 
ON recurring_expenses(is_paid_current_month);

-- Comentário na coluna para documentação
COMMENT ON COLUMN recurring_expenses.is_paid_current_month IS 'Indica se a despesa recorrente foi paga no mês corrente';

