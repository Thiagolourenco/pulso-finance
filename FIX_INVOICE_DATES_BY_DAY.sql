-- ============================================
-- Script para corrigir datas de faturas antigas
-- Atualiza apenas o DIA de vencimento, mantendo mês/ano atual
-- ============================================

-- Atualiza faturas abertas que têm data de vencimento no passado
-- Usa apenas o DIA do vencimento, mantendo o mês/ano atual
UPDATE card_invoices ci
SET 
  -- Data de vencimento: usa apenas o dia do cartão, mantendo mês/ano atual
  due_date = (
    SELECT 
      -- Se o dia já passou no mês atual, usa o próximo mês
      CASE 
        WHEN EXTRACT(DAY FROM CURRENT_DATE) > c.due_day THEN
          -- Vence no próximo mês
          (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + (c.due_day - 1 || ' days')::INTERVAL)::DATE
        ELSE
          -- Vence no mês atual
          (DATE_TRUNC('month', CURRENT_DATE) + (c.due_day - 1 || ' days')::INTERVAL)::DATE
      END
    FROM cards c
    WHERE c.id = ci.card_id
  ),
  -- Data de fechamento: usa apenas o dia do cartão, mantendo mês/ano atual
  closing_date = (
    SELECT 
      CASE 
        WHEN EXTRACT(DAY FROM CURRENT_DATE) > c.closing_day THEN
          -- Fecha no próximo mês
          (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + (c.closing_day - 1 || ' days')::INTERVAL)::DATE
        ELSE
          -- Fecha no mês atual
          (DATE_TRUNC('month', CURRENT_DATE) + (c.closing_day - 1 || ' days')::INTERVAL)::DATE
      END
    FROM cards c
    WHERE c.id = ci.card_id
  ),
  -- Mês de referência: mês atual ou próximo
  reference_month = (
    SELECT 
      CASE 
        WHEN EXTRACT(DAY FROM CURRENT_DATE) > c.closing_day THEN
          (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE
        ELSE
          DATE_TRUNC('month', CURRENT_DATE)::DATE
      END
    FROM cards c
    WHERE c.id = ci.card_id
  ),
  updated_at = NOW()
FROM cards c
WHERE 
  ci.card_id = c.id
  AND ci.status = 'open'
  AND ci.due_date < CURRENT_DATE;

-- Mostra as faturas que foram atualizadas
SELECT 
  c.name as cartao,
  c.due_day as dia_vencimento,
  ci.due_date as nova_data_vencimento,
  ci.reference_month as mes_referencia,
  ci.total_amount as valor
FROM card_invoices ci
JOIN cards c ON c.id = ci.card_id
WHERE 
  ci.status = 'open'
  AND ci.updated_at >= CURRENT_DATE - INTERVAL '1 minute'
ORDER BY c.name, ci.due_date;

