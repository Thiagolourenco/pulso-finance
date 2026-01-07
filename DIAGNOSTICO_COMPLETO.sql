-- ============================================
-- Script de DIAGNÓSTICO COMPLETO
-- Execute este script para entender o problema
-- ============================================

-- 1. Verifica qual schema está sendo usado
SELECT 
    current_schema() as schema_atual,
    current_database() as database_atual;

-- 2. Lista TODAS as colunas da tabela categories
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default,
    table_schema,
    ordinal_position
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY table_schema, ordinal_position;

-- 3. Verifica especificamente se monthly_limit existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'categories' 
            AND column_name = 'monthly_limit'
        ) THEN '✅ EXISTE no schema public'
        ELSE '❌ NÃO EXISTE no schema public'
    END as status_monthly_limit;

-- 4. Verifica se existe em outros schemas
SELECT 
    table_schema,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'categories' 
AND column_name = 'monthly_limit';

-- 5. Lista todas as tabelas no schema public
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 6. Verifica a estrutura completa da tabela categories
SELECT 
    a.attname as column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
    a.attnotnull as not_null,
    a.atthasdef as has_default
FROM pg_catalog.pg_attribute a
JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'categories'
AND n.nspname = 'public'
AND a.attnum > 0
AND NOT a.attisdropped
ORDER BY a.attnum;

-- 7. Tenta fazer um SELECT na coluna (vai dar erro se não existir)
SELECT id, name, monthly_limit 
FROM public.categories 
LIMIT 1;

