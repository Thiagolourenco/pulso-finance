-- ============================================
-- Script DEFINITIVO para criar monthly_limit
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Verifica se a coluna existe e remove se necessário
DO $$ 
BEGIN
    -- Verifica se existe no schema public
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'categories' 
        AND column_name = 'monthly_limit'
    ) THEN
        -- Remove a coluna se existir
        ALTER TABLE public.categories DROP COLUMN monthly_limit CASCADE;
        RAISE NOTICE 'Coluna monthly_limit removida para recriação';
    END IF;
END $$;

-- 2. Cria a coluna monthly_limit
ALTER TABLE public.categories 
ADD COLUMN monthly_limit NUMERIC(12, 2) DEFAULT NULL;

-- 3. Verifica se foi criada corretamente
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'categories' 
        AND column_name = 'monthly_limit'
    ) THEN
        RAISE NOTICE '✅ Coluna monthly_limit criada com sucesso!';
    ELSE
        RAISE EXCEPTION '❌ Erro: Coluna monthly_limit não foi criada!';
    END IF;
END $$;

-- 4. Adiciona comentário
COMMENT ON COLUMN public.categories.monthly_limit IS 'Limite mensal de gasto para esta categoria (opcional)';

-- 5. Cria índice
CREATE INDEX IF NOT EXISTS idx_categories_monthly_limit 
ON public.categories(monthly_limit) 
WHERE monthly_limit IS NOT NULL;

-- 6. Verificação final - deve retornar 1 linha
SELECT 
    'Verificação: Coluna monthly_limit existe' as status,
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'categories' 
AND column_name = 'monthly_limit';

-- 7. Teste: Tenta fazer um SELECT incluindo monthly_limit
SELECT id, name, monthly_limit 
FROM public.categories 
LIMIT 1;

-- Se todas as queries acima executarem sem erro, a coluna foi criada corretamente!

