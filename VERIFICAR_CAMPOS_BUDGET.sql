-- ============================================
-- Script para verificar qual campo de limite existe
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Verifica se monthly_limit existe
SELECT 
    'monthly_limit' as campo,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'categories' 
            AND column_name = 'monthly_limit'
        ) THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE'
    END as status;

-- 2. Verifica se budget_limit existe
SELECT 
    'budget_limit' as campo,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'categories' 
            AND column_name = 'budget_limit'
        ) THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE'
    END as status;

-- 3. Lista TODAS as colunas relacionadas a budget/limit
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'categories'
AND (column_name LIKE '%limit%' OR column_name LIKE '%budget%')
ORDER BY column_name;

-- 4. Lista TODAS as colunas da tabela categories
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'categories'
ORDER BY ordinal_position;

