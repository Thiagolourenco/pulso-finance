-- ============================================
-- Query para adicionar coluna is_recurring à tabela card_purchases
-- Execute no SQL Editor do Supabase
-- ============================================

-- Adiciona a coluna is_recurring se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'card_purchases' 
    AND column_name = 'is_recurring'
  ) THEN
    ALTER TABLE card_purchases ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE 'Coluna is_recurring adicionada à tabela card_purchases';
  ELSE
    RAISE NOTICE 'Coluna is_recurring já existe na tabela card_purchases';
  END IF;
END $$;

-- Verifica se a coluna foi criada corretamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'card_purchases'
  AND column_name = 'is_recurring';








