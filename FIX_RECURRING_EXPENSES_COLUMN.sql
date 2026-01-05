-- ============================================
-- Script para adicionar is_paid_current_month em recurring_expenses
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Adiciona a coluna se não existir
ALTER TABLE recurring_expenses
ADD COLUMN IF NOT EXISTS is_paid_current_month BOOLEAN NOT NULL DEFAULT false;

-- Cria índice
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_is_paid_current_month 
ON recurring_expenses(is_paid_current_month);

-- Adiciona comentário
COMMENT ON COLUMN recurring_expenses.is_paid_current_month IS 'Indica se a despesa recorrente foi paga no mês corrente';

