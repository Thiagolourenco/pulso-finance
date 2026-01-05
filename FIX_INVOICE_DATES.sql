-- ============================================
-- Script para corrigir datas de faturas antigas
-- Atualiza faturas abertas que têm datas no passado
-- ============================================

-- Atualiza faturas abertas que têm data de vencimento no passado
-- Recalcula as datas baseadas no dia de fechamento e vencimento do cartão
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
  -- A data de vencimento sempre vem depois da data de fechamento
  due_date = (
    SELECT 
      CASE 
        -- Se já passou o dia de fechamento, a fatura fecha no próximo mês
        WHEN EXTRACT(DAY FROM CURRENT_DATE) > c.closing_day THEN
          -- Vencimento no mês seguinte ao fechamento
          (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + (c.due_day - 1 || ' days')::INTERVAL)::DATE
        ELSE
          -- Vencimento no mesmo mês do fechamento (se o vencimento for depois do fechamento)
          -- Ou no mês seguinte (se o vencimento for antes do fechamento)
          CASE
            WHEN c.due_day > c.closing_day THEN
              (DATE_TRUNC('month', CURRENT_DATE) + (c.due_day - 1 || ' days')::INTERVAL)::DATE
            ELSE
              (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + (c.due_day - 1 || ' days')::INTERVAL)::DATE
          END
      END
    FROM cards c
    WHERE c.id = ci.card_id
  ),
  -- Atualiza o mês de referência (mês da fatura)
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
  ci.due_date as nova_data_vencimento,
  ci.reference_month as mes_referencia,
  ci.total_amount as valor
FROM card_invoices ci
JOIN cards c ON c.id = ci.card_id
WHERE 
  ci.status = 'open'
  AND ci.updated_at >= CURRENT_DATE - INTERVAL '1 minute'
ORDER BY c.name, ci.due_date;

