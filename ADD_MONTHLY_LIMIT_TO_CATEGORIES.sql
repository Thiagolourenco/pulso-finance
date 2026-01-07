-- ============================================
-- Adiciona campo monthly_limit na tabela categories
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Adiciona coluna monthly_limit (opcional, pode ser NULL)
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS monthly_limit NUMERIC(12, 2) DEFAULT NULL;

-- Adiciona comentário na coluna
COMMENT ON COLUMN categories.monthly_limit IS 'Limite mensal de gasto para esta categoria (opcional)';

-- Cria índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_categories_monthly_limit ON categories(monthly_limit) WHERE monthly_limit IS NOT NULL;

