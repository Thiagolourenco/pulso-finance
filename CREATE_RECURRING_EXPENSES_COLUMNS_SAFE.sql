-- ============================================
-- Script SEGURO para adicionar colunas (sem operações destrutivas)
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. Adiciona is_paid_current_month (se não existir)
ALTER TABLE recurring_expenses
ADD COLUMN IF NOT EXISTS is_paid_current_month BOOLEAN NOT NULL DEFAULT false;

-- 2. Adiciona transaction_id (se não existir)
ALTER TABLE recurring_expenses
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL;

-- 3. Cria índices (se não existirem)
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_is_paid_current_month 
ON recurring_expenses(is_paid_current_month);

CREATE INDEX IF NOT EXISTS idx_recurring_expenses_transaction_id 
ON recurring_expenses(transaction_id);

-- 4. Verifica se as colunas foram criadas (deve retornar 2 linhas)
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'recurring_expenses'
  AND column_name IN ('is_paid_current_month', 'transaction_id')
ORDER BY column_name;

