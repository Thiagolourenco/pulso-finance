-- ============================================
-- Script DEFINITIVO - Criar coluna monthly_limit
-- Execute este script COMPLETO no SQL Editor do Supabase
-- ============================================

-- PASSO 1: Verifica o schema atual
SELECT current_schema(), current_database();

-- PASSO 2: Verifica se a tabela categories existe
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name = 'categories';

-- PASSO 3: Remove a coluna se existir (para recriar limpa)
DO $$ 
DECLARE
    col_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'categories' 
        AND column_name = 'monthly_limit'
    ) INTO col_exists;
    
    IF col_exists THEN
        ALTER TABLE public.categories DROP COLUMN monthly_limit CASCADE;
        RAISE NOTICE '✅ Coluna monthly_limit removida para recriação';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna monthly_limit não existe, será criada';
    END IF;
END $$;

-- PASSO 4: Cria a coluna monthly_limit
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS monthly_limit NUMERIC(12, 2) DEFAULT NULL;

-- PASSO 5: Verifica se foi criada corretamente
DO $$
DECLARE
    col_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'categories' 
        AND column_name = 'monthly_limit'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE '✅ SUCESSO: Coluna monthly_limit criada!';
    ELSE
        RAISE EXCEPTION '❌ ERRO: Coluna monthly_limit não foi criada!';
    END IF;
END $$;

-- PASSO 6: Adiciona comentário
COMMENT ON COLUMN public.categories.monthly_limit IS 'Limite mensal de gasto para esta categoria (opcional)';

-- PASSO 7: Cria índice para performance
DROP INDEX IF EXISTS idx_categories_monthly_limit;
CREATE INDEX idx_categories_monthly_limit 
ON public.categories(monthly_limit) 
WHERE monthly_limit IS NOT NULL;

-- PASSO 8: Verificação final - deve retornar 1 linha
SELECT 
    '✅ VERIFICAÇÃO FINAL' as status,
    column_name, 
    data_type,
    is_nullable,
    column_default,
    table_schema
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'categories' 
AND column_name = 'monthly_limit';

-- PASSO 9: Teste prático - tenta fazer um SELECT
SELECT 
    id, 
    name, 
    type,
    monthly_limit  -- Esta linha vai dar erro se a coluna não existir
FROM public.categories 
LIMIT 5;

-- Se todas as queries acima executarem sem erro, a coluna foi criada com sucesso!
-- Aguarde 10-30 segundos e recarregue a página do app

