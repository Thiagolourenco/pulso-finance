-- =============================================================================
-- DEBUG: receita / despesas (mês passado vs mês atual) + total investido
-- Rode no SQL Editor do Supabase (schema public).
--
-- USUÁRIO: edite SÓ o bloco em "params" abaixo (não use texto solto como UUID).
--   - Opção A: descomente WHERE u.email = '...' e coloque seu e-mail de login.
--   - Opção B: use UUID fixo na linha user_id_fixo (descomente e comente a subquery).
--   - Opção C: deixe como está = primeiro usuário em auth.users (só ok se for 1 conta).
-- Opcional: troque CURRENT_DATE em "hoje" por '2026-04-01'::date para simular o "hoje".
-- =============================================================================

WITH
params AS (
  SELECT
    (
      -- Troque o SELECT abaixo por um UUID fixo se quiser, ex.:
      -- SELECT 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid AS id
      SELECT u.id
      FROM auth.users u
      -- WHERE u.email = 'seu@email.com'   -- recomendado se existir mais de um usuário
      ORDER BY u.created_at ASC
      LIMIT 1
    ) AS user_id,
    CURRENT_DATE::date AS hoje
),
meses AS (
  SELECT
    p.user_id,
    p.hoje,
    -- Mês atual (intervalo inclusivo)
    date_trunc('month', p.hoje)::date AS atual_inicio,
    (date_trunc('month', p.hoje) + interval '1 month - 1 day')::date AS atual_fim,
    -- Mês passado (intervalo inclusivo)
    (date_trunc('month', p.hoje) - interval '1 month')::date AS passado_inicio,
    (date_trunc('month', p.hoje) - interval '1 day')::date AS passado_fim
  FROM params p
),

-- ---------- RECEITAS (só transações type = income) ----------
receitas AS (
  SELECT
    m.user_id,
    COALESCE(SUM(CASE WHEN t.date BETWEEN m.passado_inicio AND m.passado_fim AND t.type = 'income' THEN t.amount ELSE 0 END), 0) AS receita_mes_passado,
    COALESCE(SUM(CASE WHEN t.date BETWEEN m.atual_inicio AND m.atual_fim AND t.type = 'income' THEN t.amount ELSE 0 END), 0) AS receita_mes_atual
  FROM meses m
  LEFT JOIN public.transactions t ON t.user_id = m.user_id
  GROUP BY m.user_id
),

-- ---------- DESPESAS: transações (expense) ----------
desp_trans AS (
  SELECT
    m.user_id,
    COALESCE(SUM(CASE WHEN t.date BETWEEN m.passado_inicio AND m.passado_fim AND t.type = 'expense' THEN ABS(t.amount) ELSE 0 END), 0) AS desp_trans_passado,
    COALESCE(SUM(CASE WHEN t.date BETWEEN m.atual_inicio AND m.atual_fim AND t.type = 'expense' THEN ABS(t.amount) ELSE 0 END), 0) AS desp_trans_atual
  FROM meses m
  LEFT JOIN public.transactions t ON t.user_id = m.user_id
  GROUP BY m.user_id
),

-- ---------- DESPESAS: faturas (due_date no mês; igual ideia do relatório para mês que NÃO é "ao vivo") ----------
-- Para o mês passado: soma total_amount onde vencimento cai no mês.
-- (No app, no mês *atual* ainda entram faturas abertas atrasadas; aqui separamos para você ver.)
desp_fat AS (
  SELECT
    m.user_id,
    COALESCE(SUM(CASE
      WHEN i.due_date::date BETWEEN m.passado_inicio AND m.passado_fim
      THEN i.total_amount ELSE 0 END), 0) AS fat_passado,
    COALESCE(SUM(CASE
      WHEN i.due_date::date BETWEEN m.atual_inicio AND m.atual_fim
      THEN i.total_amount ELSE 0 END), 0) AS fat_atual
  FROM meses m
  LEFT JOIN public.card_invoices i ON i.user_id = m.user_id
  GROUP BY m.user_id
),

-- ---------- DESPESAS: recorrentes ativas (vencimento no mês; regra próxima ao app) ----------
-- Data de vencimento no mês = primeiro dia do mês + (due_day - 1) dias
desp_rec AS (
  SELECT
    m.user_id,
    COALESCE(SUM(CASE
      WHEN re.is_active
       AND (date_trunc('month', m.passado_inicio::timestamp) + (re.due_day - 1) * interval '1 day')::date
           BETWEEN m.passado_inicio AND m.passado_fim
      THEN re.amount ELSE 0 END), 0) AS rec_passado,
    COALESCE(SUM(CASE
      WHEN re.is_active
       AND (date_trunc('month', m.atual_inicio::timestamp) + (re.due_day - 1) * interval '1 day')::date
           BETWEEN m.atual_inicio AND m.atual_fim
      THEN re.amount ELSE 0 END), 0) AS rec_atual
  FROM meses m
  LEFT JOIN public.recurring_expenses re ON re.user_id = m.user_id
  GROUP BY m.user_id
),

-- ---------- INVESTIMENTO: soma current_balance em contas type = investment ----------
invest AS (
  SELECT
    m.user_id,
    COALESCE(SUM(a.current_balance), 0) AS total_investido
  FROM meses m
  LEFT JOIN public.accounts a ON a.user_id = m.user_id AND a.type = 'investment'
  GROUP BY m.user_id
)

SELECT
  m.hoje AS referencia_hoje,
  m.passado_inicio,
  m.passado_fim,
  m.atual_inicio,
  m.atual_fim,

  r.receita_mes_passado,
  r.receita_mes_atual,
  r.receita_mes_atual - r.receita_mes_passado AS diff_receita,

  dt.desp_trans_passado,
  dt.desp_trans_atual,

  df.fat_passado,
  df.fat_atual,

  dr.rec_passado,
  dr.rec_atual,

  (dt.desp_trans_passado + df.fat_passado + dr.rec_passado) AS despesas_totais_mes_passado,
  (dt.desp_trans_atual + df.fat_atual + dr.rec_atual) AS despesas_totais_mes_atual,

  (r.receita_mes_passado - (dt.desp_trans_passado + df.fat_passado + dr.rec_passado)) AS saldo_mes_passado,
  (r.receita_mes_atual - (dt.desp_trans_atual + df.fat_atual + dr.rec_atual)) AS saldo_mes_atual,

  COALESCE(i.total_investido, 0) AS total_investido

FROM meses m
JOIN receitas r ON r.user_id = m.user_id
JOIN desp_trans dt ON dt.user_id = m.user_id
JOIN desp_fat df ON df.user_id = m.user_id
JOIN desp_rec dr ON dr.user_id = m.user_id
LEFT JOIN invest i ON i.user_id = m.user_id;

-- =============================================================================
-- Detalhe: transações do mês passado (conferência linha a linha)
-- Rode este bloco SEPARADO (mesmo critério de usuário que em params acima).
-- =============================================================================
/*
WITH u AS (
  SELECT id AS user_id FROM auth.users
  -- WHERE email = 'seu@email.com'
  ORDER BY created_at ASC
  LIMIT 1
)
SELECT t.id, t.date, t.type, t.amount, t.description
FROM public.transactions t
JOIN u ON t.user_id = u.user_id
WHERE t.date >= (date_trunc('month', CURRENT_DATE) - interval '1 month')::date
  AND t.date < date_trunc('month', CURRENT_DATE)::date
ORDER BY t.date DESC, t.created_at DESC;
*/
