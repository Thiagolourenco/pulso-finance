-- ============================================
-- Script para forçar atualização do cache do schema
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Força o Supabase a reconhecer a coluna fazendo uma query simples
SELECT 
    id, 
    name, 
    type,
    monthly_limit  -- Esta linha força o Supabase a atualizar o cache
FROM categories 
LIMIT 1;

-- 2. Verifica todas as colunas da tabela categories
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'categories'
ORDER BY ordinal_position;

-- 3. Tenta fazer um UPDATE simples (mesmo que não altere nada)
-- Isso força o Supabase a validar o schema
UPDATE categories 
SET updated_at = updated_at 
WHERE id IN (
    SELECT id FROM categories LIMIT 1
);

-- 4. Verifica novamente a coluna monthly_limit
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'categories' 
AND column_name = 'monthly_limit';

-- Se todas as queries acima executarem sem erro, a coluna está correta
-- O problema é apenas cache do cliente (TypeScript/JavaScript)

