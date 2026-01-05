-- ============================================
-- Migration: Adicionar campo is_paid_current_month na tabela recurring_expenses
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Verifica se a coluna já existe antes de adicionar
DO $$ 
BEGIN
  -- Adiciona a coluna se ela não existir
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'recurring_expenses' 
    AND column_name = 'is_paid_current_month'
  ) THEN
    ALTER TABLE recurring_expenses
    ADD COLUMN is_paid_current_month BOOLEAN NOT NULL DEFAULT false;
    
    RAISE NOTICE 'Coluna is_paid_current_month adicionada com sucesso na tabela recurring_expenses';
  ELSE
    RAISE NOTICE 'Coluna is_paid_current_month já existe na tabela recurring_expenses';
  END IF;
END $$;

-- Cria índice para melhorar performance em consultas que filtram por is_paid_current_month
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_is_paid_current_month 
ON recurring_expenses(is_paid_current_month);

-- Comentário na coluna para documentação
COMMENT ON COLUMN recurring_expenses.is_paid_current_month IS 'Indica se a despesa recorrente foi paga no mês corrente';

-- Verifica se a coluna foi criada corretamente
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'recurring_expenses'
  AND column_name = 'is_paid_current_month';

