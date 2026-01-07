-- ============================================
-- Script ALTERNATIVO: Criar monthly_limit e copiar dados de budget_limit
-- Execute este script se quiser manter ambos ou criar monthly_limit
-- ============================================

-- 1. Verifica se budget_limit existe e tem dados
DO $$
DECLARE
    budget_limit_exists boolean;
    monthly_limit_exists boolean;
    row_count integer;
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
    
    -- Se budget_limit existe mas monthly_limit não, cria monthly_limit e copia dados
    IF budget_limit_exists AND NOT monthly_limit_exists THEN
        -- Cria a coluna monthly_limit
        ALTER TABLE public.categories 
        ADD COLUMN monthly_limit NUMERIC(12, 2) DEFAULT NULL;
        
        -- Copia os dados de budget_limit para monthly_limit
        UPDATE public.categories 
        SET monthly_limit = budget_limit 
        WHERE budget_limit IS NOT NULL;
        
        RAISE NOTICE '✅ Coluna monthly_limit criada e dados copiados de budget_limit';
        
        -- Conta quantas linhas foram atualizadas
        GET DIAGNOSTICS row_count = ROW_COUNT;
        RAISE NOTICE '📊 % linhas atualizadas com dados de budget_limit', row_count;
    ELSIF monthly_limit_exists THEN
        RAISE NOTICE 'ℹ️ Coluna monthly_limit já existe';
    ELSE
        RAISE NOTICE '⚠️ Nenhuma das colunas existe. Execute o script de criação.';
    END IF;
END $$;

-- 2. Verifica o resultado
SELECT 
    column_name, 
    data_type,
    is_nullable,
    (SELECT COUNT(*) FROM categories WHERE monthly_limit IS NOT NULL) as registros_com_limite
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'categories'
AND column_name = 'monthly_limit';

