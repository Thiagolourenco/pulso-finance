-- ============================================
-- Script completo para atualizar o schema do banco de dados
-- Inclui todas as colunas necessárias para o funcionamento correto
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- ============================================
-- 1. Adicionar is_paid_current_month em card_purchases
-- ============================================
ALTER TABLE card_purchases
ADD COLUMN IF NOT EXISTS is_paid_current_month BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_card_purchases_is_paid_current_month 
ON card_purchases(is_paid_current_month);

COMMENT ON COLUMN card_purchases.is_paid_current_month IS 'Indica se a parcela atual da compra foi paga no mês corrente';

-- ============================================
-- 2. Adicionar is_paid_current_month em recurring_expenses
-- ============================================
ALTER TABLE recurring_expenses
ADD COLUMN IF NOT EXISTS is_paid_current_month BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_recurring_expenses_is_paid_current_month 
ON recurring_expenses(is_paid_current_month);

COMMENT ON COLUMN recurring_expenses.is_paid_current_month IS 'Indica se a despesa recorrente foi paga no mês corrente';

-- ============================================
-- 3. Garantir que is_recurring existe em card_purchases
-- ============================================
ALTER TABLE card_purchases
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_card_purchases_is_recurring 
ON card_purchases(is_recurring);

COMMENT ON COLUMN card_purchases.is_recurring IS 'Indica se a compra é recorrente';

-- ============================================
-- Verificação: Mostra as colunas adicionadas
-- ============================================
SELECT 
  table_name,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('card_purchases', 'recurring_expenses')
  AND column_name IN ('is_paid_current_month', 'is_recurring')
ORDER BY table_name, column_name;

