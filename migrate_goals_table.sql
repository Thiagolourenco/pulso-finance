-- ============================================
-- Script de Migração: Atualizar tabela goals
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Verifica se a coluna target_date já existe
DO $$
BEGIN
  -- Se a coluna target_date não existe, adiciona
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'goals' 
    AND column_name = 'target_date'
  ) THEN
    -- Se existe uma coluna 'deadline', migra os dados primeiro
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'goals' 
      AND column_name = 'deadline'
    ) THEN
      -- Adiciona a nova coluna
      ALTER TABLE goals ADD COLUMN target_date DATE;
      
      -- Migra os dados de deadline para target_date
      UPDATE goals SET target_date = deadline::DATE WHERE deadline IS NOT NULL;
      
      -- Remove a coluna antiga
      ALTER TABLE goals DROP COLUMN deadline;
      
      RAISE NOTICE 'Coluna deadline migrada para target_date';
    ELSE
      -- Se não existe deadline, apenas adiciona target_date
      ALTER TABLE goals ADD COLUMN target_date DATE;
      RAISE NOTICE 'Coluna target_date adicionada';
    END IF;
  ELSE
    RAISE NOTICE 'Coluna target_date já existe';
  END IF;
END $$;

-- Verifica se a coluna current_amount existe e tem o valor padrão correto
DO $$
BEGIN
  -- Se current_amount não existe, adiciona
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'goals' 
    AND column_name = 'current_amount'
  ) THEN
    ALTER TABLE goals ADD COLUMN current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;
    RAISE NOTICE 'Coluna current_amount adicionada';
  ELSE
    -- Se existe, verifica se tem o valor padrão
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'goals' 
      AND column_name = 'current_amount'
      AND column_default = '0'
    ) THEN
      -- Atualiza valores NULL para 0
      UPDATE goals SET current_amount = 0 WHERE current_amount IS NULL;
      
      -- Define o valor padrão
      ALTER TABLE goals ALTER COLUMN current_amount SET DEFAULT 0;
      ALTER TABLE goals ALTER COLUMN current_amount SET NOT NULL;
      
      RAISE NOTICE 'Coluna current_amount atualizada';
    ELSE
      RAISE NOTICE 'Coluna current_amount já está correta';
    END IF;
  END IF;
END $$;

-- Verifica se o índice em target_date existe
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date) WHERE target_date IS NOT NULL;

-- Verifica se todas as colunas necessárias existem
DO $$
DECLARE
  missing_columns TEXT[];
BEGIN
  SELECT ARRAY_AGG(column_name)
  INTO missing_columns
  FROM (
    SELECT 'id' AS column_name
    UNION SELECT 'user_id'
    UNION SELECT 'name'
    UNION SELECT 'target_amount'
    UNION SELECT 'current_amount'
    UNION SELECT 'target_date'
    UNION SELECT 'created_at'
    UNION SELECT 'updated_at'
  ) AS required
  WHERE NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'goals' 
    AND column_name = required.column_name
  );
  
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Colunas faltando na tabela goals: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE 'Todas as colunas necessárias estão presentes na tabela goals';
  END IF;
END $$;

-- ============================================
-- Fim do script de migração
-- ============================================




