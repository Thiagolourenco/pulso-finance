-- ============================================
-- Script FINAL para adicionar colunas em recurring_expenses
-- Execute este script INTEIRO no Supabase SQL Editor
-- ============================================

-- Primeiro, remove índices se existirem (para evitar conflitos)
DROP INDEX IF EXISTS idx_recurring_expenses_is_paid_current_month;
DROP INDEX IF EXISTS idx_recurring_expenses_transaction_id;

-- Remove constraints se existirem
DO $$ 
BEGIN
  -- Remove a coluna is_paid_current_month se existir (para recriar limpa)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_expenses' 
    AND column_name = 'is_paid_current_month'
  ) THEN
    ALTER TABLE recurring_expenses DROP COLUMN is_paid_current_month CASCADE;
  END IF;
  
  -- Remove a coluna transaction_id se existir (para recriar limpa)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_expenses' 
    AND column_name = 'transaction_id'
  ) THEN
    ALTER TABLE recurring_expenses DROP COLUMN transaction_id CASCADE;
  END IF;
END $$;

-- Agora cria as colunas FRESCAS
ALTER TABLE recurring_expenses
ADD COLUMN is_paid_current_month BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE recurring_expenses
ADD COLUMN transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL;

-- Cria os índices
CREATE INDEX idx_recurring_expenses_is_paid_current_month 
ON recurring_expenses(is_paid_current_month);

CREATE INDEX idx_recurring_expenses_transaction_id 
ON recurring_expenses(transaction_id);

-- Adiciona comentários
COMMENT ON COLUMN recurring_expenses.is_paid_current_month IS 'Indica se a despesa recorrente foi paga no mês corrente';
COMMENT ON COLUMN recurring_expenses.transaction_id IS 'ID da transação criada quando a despesa é marcada como paga no mês corrente';

-- VERIFICAÇÃO FINAL - Deve retornar 2 linhas
SELECT 
  'Colunas criadas com sucesso!' as status,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'recurring_expenses'
  AND column_name IN ('is_paid_current_month', 'transaction_id')
ORDER BY column_name;

