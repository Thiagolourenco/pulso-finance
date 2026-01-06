-- ============================================
-- Script FORÇADO para criar colunas (remove e recria se necessário)
-- Use apenas se o script normal não funcionar
-- ============================================

-- Remove índices se existirem
DROP INDEX IF EXISTS idx_recurring_expenses_is_paid_current_month;
DROP INDEX IF EXISTS idx_recurring_expenses_transaction_id;

-- Remove as colunas se existirem (isso vai dar erro se houver dados dependentes, mas é seguro)
DO $$ 
BEGIN
  -- Tenta remover is_paid_current_month
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_expenses' AND column_name = 'is_paid_current_month'
  ) THEN
    ALTER TABLE recurring_expenses DROP COLUMN is_paid_current_month;
  END IF;
  
  -- Tenta remover transaction_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_expenses' AND column_name = 'transaction_id'
  ) THEN
    ALTER TABLE recurring_expenses DROP COLUMN transaction_id;
  END IF;
END $$;

-- Agora cria as colunas
ALTER TABLE recurring_expenses
ADD COLUMN is_paid_current_month BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE recurring_expenses
ADD COLUMN transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL;

-- Cria índices
CREATE INDEX idx_recurring_expenses_is_paid_current_month 
ON recurring_expenses(is_paid_current_month);

CREATE INDEX idx_recurring_expenses_transaction_id 
ON recurring_expenses(transaction_id);

-- Adiciona comentários
COMMENT ON COLUMN recurring_expenses.is_paid_current_month IS 'Indica se a despesa recorrente foi paga no mês corrente';
COMMENT ON COLUMN recurring_expenses.transaction_id IS 'ID da transação criada quando a despesa é marcada como paga no mês corrente';

-- Verifica se foram criadas
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'recurring_expenses'
  AND column_name IN ('is_paid_current_month', 'transaction_id')
ORDER BY column_name;

