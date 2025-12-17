-- ============================================
-- Query para atualizar tabela goals
-- Execute no SQL Editor do Supabase
-- ============================================

-- Adiciona a coluna target_date se não existir
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

-- Garante que current_amount existe com valor padrão
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
    -- Atualiza valores NULL para 0
    UPDATE goals SET current_amount = 0 WHERE current_amount IS NULL;
    
    -- Define o valor padrão e NOT NULL se necessário
    ALTER TABLE goals ALTER COLUMN current_amount SET DEFAULT 0;
    ALTER TABLE goals ALTER COLUMN current_amount SET NOT NULL;
    
    RAISE NOTICE 'Coluna current_amount atualizada';
  END IF;
END $$;

-- Cria índice em target_date para melhor performance
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date) WHERE target_date IS NOT NULL;

-- Verifica se tudo está correto
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'goals'
ORDER BY ordinal_position;







