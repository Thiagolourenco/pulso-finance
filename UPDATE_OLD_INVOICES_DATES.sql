-- ============================================
-- Script para atualizar datas de faturas antigas
-- Atualiza faturas abertas com datas de vencimento no passado
-- ============================================

-- Atualiza faturas abertas que têm data de vencimento no passado
-- Calcula novas datas baseadas no dia de fechamento e vencimento do cartão
UPDATE card_invoices ci
SET 
  -- Calcula nova data de fechamento baseada no mês atual
  closing_date = (
    SELECT 
      CASE 
        -- Se já passou o dia de fechamento no mês atual, fecha no próximo mês
        WHEN EXTRACT(DAY FROM CURRENT_DATE) > c.closing_day THEN
          (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + (c.closing_day - 1 || ' days')::INTERVAL)::DATE
        ELSE
          (DATE_TRUNC('month', CURRENT_DATE) + (c.closing_day - 1 || ' days')::INTERVAL)::DATE
      END
    FROM cards c
    WHERE c.id = ci.card_id
  ),
  -- Calcula nova data de vencimento baseada no dia de vencimento do cartão
  due_date = (
    SELECT 
      CASE 
        -- Se já passou o dia de fechamento, a fatura fecha no próximo mês
        WHEN EXTRACT(DAY FROM CURRENT_DATE) > c.closing_day THEN
          (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + (c.due_day - 1 || ' days')::INTERVAL)::DATE
        ELSE
          (DATE_TRUNC('month', CURRENT_DATE) + (c.due_day - 1 || ' days')::INTERVAL)::DATE
      END
    FROM cards c
    WHERE c.id = ci.card_id
  ),
  -- Atualiza o mês de referência
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

-- Verifica quantas faturas foram atualizadas
SELECT 
  COUNT(*) as faturas_atualizadas,
  c.name as cartao
FROM card_invoices ci
JOIN cards c ON c.id = ci.card_id
WHERE 
  ci.status = 'open'
  AND ci.due_date >= CURRENT_DATE
  AND ci.updated_at >= CURRENT_DATE - INTERVAL '1 minute'
GROUP BY c.name;

