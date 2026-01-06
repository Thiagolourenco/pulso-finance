-- ============================================
-- Adicionar coluna transaction_id em recurring_expenses
-- Para armazenar o ID da transação criada quando a despesa é marcada como paga
-- ============================================

ALTER TABLE recurring_expenses
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_recurring_expenses_transaction_id 
ON recurring_expenses(transaction_id);

COMMENT ON COLUMN recurring_expenses.transaction_id IS 'ID da transação criada quando a despesa é marcada como paga no mês corrente';

