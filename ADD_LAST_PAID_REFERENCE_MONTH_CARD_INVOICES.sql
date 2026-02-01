-- ============================================
-- Migration: Adicionar last_paid_reference_month em card_invoices
-- Para que o checkbox "Paga" volte a ficar desmarcado quando o mês virar.
-- Execute no SQL Editor do Supabase
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'card_invoices' 
    AND column_name = 'last_paid_reference_month'
  ) THEN
    ALTER TABLE card_invoices
    ADD COLUMN last_paid_reference_month TEXT;
    
    COMMENT ON COLUMN card_invoices.last_paid_reference_month IS 'Mês em que foi marcado como pago (formato YYYY-MM). Ao virar o mês, o checkbox volta a ficar desmarcado.';
    RAISE NOTICE 'Coluna last_paid_reference_month adicionada em card_invoices';
  ELSE
    RAISE NOTICE 'Coluna last_paid_reference_month já existe em card_invoices';
  END IF;
END $$;
