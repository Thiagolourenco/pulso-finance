-- ============================================
-- Script para RENOMEAR budget_limit para monthly_limit
-- Execute este script se budget_limit existir e monthly_limit não existir
-- ============================================

-- 1. Verifica se budget_limit existe
DO $$
DECLARE
    budget_limit_exists boolean;
    monthly_limit_exists boolean;
BEGIN
    -- Verifica budget_limit
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'categories' 
        AND column_name = 'budget_limit'
    ) INTO budget_limit_exists;
    
    -- Verifica monthly_limit
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'categories' 
        AND column_name = 'monthly_limit'
    ) INTO monthly_limit_exists;
    
    -- Se budget_limit existe e monthly_limit não existe, renomeia
    IF budget_limit_exists AND NOT monthly_limit_exists THEN
        ALTER TABLE public.categories 
        RENAME COLUMN budget_limit TO monthly_limit;
        
        RAISE NOTICE '✅ Coluna budget_limit renomeada para monthly_limit';
    ELSIF monthly_limit_exists THEN
        RAISE NOTICE 'ℹ️ Coluna monthly_limit já existe';
    ELSIF budget_limit_exists THEN
        RAISE NOTICE 'ℹ️ Coluna budget_limit existe, mas monthly_limit também existe. Mantendo ambas.';
    ELSE
        RAISE NOTICE '⚠️ Nenhuma das colunas existe. Execute o script de criação.';
    END IF;
END $$;

-- 2. Verifica o resultado
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'categories'
AND (column_name = 'monthly_limit' OR column_name = 'budget_limit')
ORDER BY column_name;

