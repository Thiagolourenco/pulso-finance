-- ============================================
-- Script: Voltar valores ao estado de ontem
-- Execute no SQL Editor do Supabase
-- ============================================
-- Reverte faturas de cartão (paid → open) e despesas recorrentes (desmarca "paga")
-- ============================================

-- ========== PASSO 1: VER O QUE EXISTE ==========

-- Todas as faturas marcadas como paid (independente de quando foram alteradas):
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
ORDER BY ci.updated_at DESC;

-- Todas as despesas recorrentes marcadas como paga:
SELECT 
  id,
  name,
  amount,
  due_day,
  is_paid_current_month,
  updated_at
FROM recurring_expenses
WHERE is_paid_current_month = true
ORDER BY updated_at DESC;


-- ========== PASSO 2: EXECUTAR A REVERSÃO ==========
-- Se os SELECT acima retornaram linhas, descomente e execute:

-- 1) Reverter TODAS as faturas: paid → open
-- (Se tiver last_paid_reference_month, rode também: UPDATE card_invoices SET last_paid_reference_month = NULL WHERE status = 'open';)
/*
UPDATE card_invoices
SET status = 'open'
WHERE status = 'paid';
*/

-- 2) Reverter TODAS as despesas recorrentes
/*
UPDATE recurring_expenses
SET is_paid_current_month = false;
*/

-- 3) Se tiver last_paid_reference_month (opcional):
/*
UPDATE recurring_expenses
SET last_paid_reference_month = NULL
WHERE last_paid_reference_month IS NOT NULL;
*/


