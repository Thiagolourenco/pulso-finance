-- ============================================
-- Migration: Adicionar last_paid_reference_month em recurring_expenses
-- Para evitar que despesas apareçam como "pagas" automaticamente quando o mês vira.
-- O pagamento só deve ser considerado quando o usuário clicar em "Pagar" no mês atual.
-- Execute este script no SQL Editor do Supabase
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'recurring_expenses' 
    AND column_name = 'last_paid_reference_month'
  ) THEN
    ALTER TABLE recurring_expenses
    ADD COLUMN last_paid_reference_month TEXT;
    
    COMMENT ON COLUMN recurring_expenses.last_paid_reference_month IS 'Mês de referência do último pagamento (formato YYYY-MM). Usado para evitar que o status "pago" persista quando o mês vira.';
    RAISE NOTICE 'Coluna last_paid_reference_month adicionada com sucesso';
  ELSE
    RAISE NOTICE 'Coluna last_paid_reference_month já existe';
  END IF;
END $$;
