-- ============================================
-- Script: Reverter valores alterados ontem
-- Execute no SQL Editor do Supabase
-- ============================================
-- Este script reverte:
-- 1. Faturas de cartão (card_invoices): status 'paid' → 'open' 
-- 2. Despesas recorrentes: is_paid_current_month = false
--
-- NOTA: O Supabase usa UTC. Para "ontem" no Brasil, tente INTERVAL '1 day' ou '2 days'.
-- Para última semana: INTERVAL '7 days'
-- ============================================

-- PASSO 1: Visualizar o que será revertido (EXECUTE PRIMEIRO PARA CONFERIR)
-- ----------------------------------------

-- Faturas de cartão que seriam revertidas (paid → open):
SELECT 
  ci.id,
  c.name as cartao,
  ci.reference_month,
  ci.due_date,
  ci.status,
  ci.total_amount,
  ci.updated_at
FROM card_invoices ci
JOIN cards c ON c.id = ci.card_id
WHERE ci.status = 'paid'
  AND ci.updated_at >= (CURRENT_DATE - INTERVAL '1 day')::timestamp
  AND ci.updated_at < CURRENT_DATE::timestamp
ORDER BY ci.updated_at DESC;

-- Despesas recorrentes que seriam revertidas:
SELECT 
  id,
  name,
  amount,
  due_day,
  is_paid_current_month,
  updated_at
FROM recurring_expenses
WHERE is_paid_current_month = true
  AND updated_at >= (CURRENT_DATE - INTERVAL '1 day')::timestamp
  AND updated_at < CURRENT_DATE::timestamp
ORDER BY updated_at DESC;


-- PASSO 2: Executar a reversão (descomente e execute após conferir)
-- ----------------------------------------

-- Reverter faturas de cartão: paid → open
/*
UPDATE card_invoices
SET status = 'open'
WHERE status = 'paid'
  AND updated_at >= (CURRENT_DATE - INTERVAL '1 day')::timestamp
  AND updated_at < CURRENT_DATE::timestamp;
*/

-- Reverter despesas recorrentes
-- (Se last_paid_reference_month não existir, use apenas is_paid_current_month)
/*
UPDATE recurring_expenses
SET is_paid_current_month = false
WHERE is_paid_current_month = true
  AND updated_at >= (CURRENT_DATE - INTERVAL '1 day')::timestamp
  AND updated_at < CURRENT_DATE::timestamp;
*/

-- Se a coluna last_paid_reference_month existir, descomente e rode também:
/*
UPDATE recurring_expenses
SET last_paid_reference_month = NULL
WHERE last_paid_reference_month IS NOT NULL
  AND updated_at >= (CURRENT_DATE - INTERVAL '1 day')::timestamp
  AND updated_at < CURRENT_DATE::timestamp;
*/


-- ============================================
-- OPÇÃO RÁPIDA: Reverter TODAS as faturas marcadas como pagas
-- Use se quiser desmarcar todas as faturas de cartão como "a pagar"
-- (resolve o problema de cartões mostrando "PAGA" sem ter pago)
-- ============================================

-- 1. Visualizar todas as faturas que estão como paid:
SELECT ci.id, c.name as cartao, ci.reference_month, ci.due_date, ci.status, ci.updated_at
FROM card_invoices ci
JOIN cards c ON c.id = ci.card_id
WHERE ci.status = 'paid';

-- 2. Reverter TODAS para open (descomente e execute):
/*
UPDATE card_invoices
SET status = 'open'
WHERE status = 'paid';
*/
