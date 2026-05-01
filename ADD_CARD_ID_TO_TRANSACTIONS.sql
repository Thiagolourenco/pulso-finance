-- ============================================
-- Adiciona a coluna card_id na tabela transactions
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Adiciona a coluna card_id (nullable, FK para cards)
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS card_id UUID REFERENCES cards(id) ON DELETE SET NULL;

-- 2. Cria índice para melhorar performance de consultas por cartão
CREATE INDEX IF NOT EXISTS idx_transactions_card_id
ON transactions(card_id);

-- 3. Força atualização do cache do schema no Supabase
NOTIFY pgrst, 'reload schema';

-- 4. Verificação: confirma que a coluna foi adicionada com sucesso
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'transactions'
  AND column_name = 'card_id';
