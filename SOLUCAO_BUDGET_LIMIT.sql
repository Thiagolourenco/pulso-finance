-- ============================================
-- SOLUÇÃO COMPLETA: Renomear budget_limit para monthly_limit
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- PASSO 1: Verifica quais campos existem
DO $$
DECLARE
    budget_limit_exists boolean;
    monthly_limit_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'budget_limit'
    ) INTO budget_limit_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'monthly_limit'
    ) INTO monthly_limit_exists;
    
    RAISE NOTICE 'budget_limit existe: %', budget_limit_exists;
    RAISE NOTICE 'monthly_limit existe: %', monthly_limit_exists;
END $$;

-- PASSO 2: Se budget_limit existe e monthly_limit não existe, RENOMEIA
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'budget_limit'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'monthly_limit'
    ) THEN
        -- Renomeia budget_limit para monthly_limit
        ALTER TABLE public.categories RENAME COLUMN budget_limit TO monthly_limit;
        RAISE NOTICE '✅ budget_limit renomeado para monthly_limit';
    ELSE
        RAISE NOTICE 'ℹ️ Nenhuma ação necessária';
    END IF;
END $$;

-- PASSO 3: Se monthly_limit ainda não existe, CRIA
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'monthly_limit'
    ) THEN
        ALTER TABLE public.categories ADD COLUMN monthly_limit NUMERIC(12, 2) DEFAULT NULL;
        RAISE NOTICE '✅ monthly_limit criado';
    ELSE
        RAISE NOTICE 'ℹ️ monthly_limit já existe';
    END IF;
END $$;

-- PASSO 4: Verificação final
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'categories'
AND (column_name = 'monthly_limit' OR column_name = 'budget_limit')
ORDER BY column_name;

-- PASSO 5: Teste - deve funcionar agora
SELECT id, name, monthly_limit 
FROM public.categories 
LIMIT 1;

