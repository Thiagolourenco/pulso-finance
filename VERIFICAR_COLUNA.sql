-- ============================================
-- Script para VERIFICAR se a coluna existe
-- Execute este script para diagnosticar o problema
-- ============================================

-- 1. Verifica todas as colunas da tabela categories
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default,
    table_schema
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- 2. Verifica especificamente se monthly_limit existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'categories' 
            AND column_name = 'monthly_limit'
        ) THEN '✅ Coluna monthly_limit EXISTE'
        ELSE '❌ Coluna monthly_limit NÃO EXISTE'
    END as status;

-- 3. Lista todas as tabelas no schema public
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 4. Verifica o schema atual
SELECT current_schema();

-- 5. Tenta fazer um SELECT na coluna (vai dar erro se não existir)
SELECT id, name, monthly_limit 
FROM public.categories 
LIMIT 1;

