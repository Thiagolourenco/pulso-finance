-- ============================================
-- Script completo para adicionar colunas necessárias em recurring_expenses
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Adiciona is_paid_current_month
ALTER TABLE recurring_expenses
ADD COLUMN IF NOT EXISTS is_paid_current_month BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_recurring_expenses_is_paid_current_month 
ON recurring_expenses(is_paid_current_month);

COMMENT ON COLUMN recurring_expenses.is_paid_current_month IS 'Indica se a despesa recorrente foi paga no mês corrente';

-- 2. Adiciona transaction_id (referência à transação criada quando marcada como paga)
ALTER TABLE recurring_expenses
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_recurring_expenses_transaction_id 
ON recurring_expenses(transaction_id);

COMMENT ON COLUMN recurring_expenses.transaction_id IS 'ID da transação criada quando a despesa é marcada como paga no mês corrente';

-- Verifica se as colunas foram criadas
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'recurring_expenses'
  AND column_name IN ('is_paid_current_month', 'transaction_id')
ORDER BY column_name;

