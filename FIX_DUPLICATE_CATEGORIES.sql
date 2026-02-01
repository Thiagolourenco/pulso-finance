-- ============================================
-- Script: Encontrar e remover categorias duplicadas
-- Execute no SQL Editor do Supabase
-- ============================================

-- PASSO 1: Verificar categorias duplicadas (mesmo nome, mesmo usuário)
-- Agrupa por nome normalizado (trim + lowercase) para pegar variações
SELECT 
  user_id,
  LOWER(TRIM(name)) as nome_normalizado,
  COUNT(*) as quantidade,
  array_agg(id ORDER BY created_at) as ids,
  array_agg(name ORDER BY created_at) as nomes
FROM categories
GROUP BY user_id, LOWER(TRIM(name))
HAVING COUNT(*) > 1;

-- PASSO 2: Para cada duplicata, manter a mais antiga e migrar referências
-- Descomente e execute APÓS conferir o resultado do PASSO 1

/*
DO $$
DECLARE
  dup RECORD;
  keep_id UUID;
  dup_id UUID;
BEGIN
  FOR dup IN 
    SELECT user_id, LOWER(TRIM(name)) as nome, array_agg(id ORDER BY created_at) as ids
    FROM categories
    GROUP BY user_id, LOWER(TRIM(name))
    HAVING COUNT(*) > 1
  LOOP
    keep_id := dup.ids[1];  -- Mantém a primeira (mais antiga)
    
    FOR i IN 2..array_length(dup.ids, 1) LOOP
      dup_id := dup.ids[i];
      
      -- Migra transações para a categoria que vai manter
      UPDATE transactions SET category_id = keep_id WHERE category_id = dup_id;
      
      -- Migra compras no cartão
      UPDATE card_purchases SET category_id = keep_id WHERE category_id = dup_id;
      
      -- Migra despesas recorrentes
      UPDATE recurring_expenses SET category_id = keep_id WHERE category_id = dup_id;
      
      -- Remove a duplicata
      DELETE FROM categories WHERE id = dup_id;
      
      RAISE NOTICE 'Duplicata removida: % (id: %)', dup.nome, dup_id;
    END LOOP;
  END LOOP;
END $$;
*/

-- PASSO 3 (opcional): Adicionar constraint UNIQUE se não existir, para evitar futuras duplicatas
-- ATENÇÃO: Só execute se não houver mais duplicatas, senão vai falhar
/*
ALTER TABLE categories 
ADD CONSTRAINT categories_user_id_name_unique UNIQUE (user_id, name);
*/
