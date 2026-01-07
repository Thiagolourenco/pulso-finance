-- ============================================
-- Script completo para adicionar monthly_limit
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Remove a coluna se já existir (para recriar corretamente)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'categories' 
        AND column_name = 'monthly_limit'
    ) THEN
        ALTER TABLE public.categories DROP COLUMN monthly_limit CASCADE;
        RAISE NOTICE 'Coluna monthly_limit removida para recriação';
    END IF;
END $$;

-- 2. Adiciona a coluna monthly_limit
ALTER TABLE public.categories 
ADD COLUMN monthly_limit NUMERIC(12, 2) DEFAULT NULL;

-- 3. Adiciona comentário na coluna
COMMENT ON COLUMN public.categories.monthly_limit IS 'Limite mensal de gasto para esta categoria (opcional)';

-- 4. Cria índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_categories_monthly_limit 
ON public.categories(monthly_limit) 
WHERE monthly_limit IS NOT NULL;

-- 5. Verifica se a coluna foi criada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'categories' 
AND column_name = 'monthly_limit';

-- Se a query acima retornar uma linha, a coluna foi criada com sucesso!
-- Aguarde alguns segundos para o Supabase atualizar o cache do schema
