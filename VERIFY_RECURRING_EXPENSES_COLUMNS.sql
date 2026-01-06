-- ============================================
-- Script para verificar se as colunas existem
-- Execute este script para verificar o status
-- ============================================

SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'recurring_expenses'
  AND column_name IN ('is_paid_current_month', 'transaction_id')
ORDER BY column_name;

-- Se não retornar nenhuma linha ou retornar menos de 2 colunas,
-- execute o script CREATE_RECURRING_EXPENSES_COLUMNS_COMPLETE.sql

