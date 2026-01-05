-- ============================================
-- Migration: Adicionar campo is_paid_current_month na tabela card_purchases
-- ============================================

-- Adiciona a coluna is_paid_current_month na tabela card_purchases
ALTER TABLE card_purchases
ADD COLUMN IF NOT EXISTS is_paid_current_month BOOLEAN NOT NULL DEFAULT false;

-- Cria índice para melhorar performance em consultas que filtram por is_paid_current_month
CREATE INDEX IF NOT EXISTS idx_card_purchases_is_paid_current_month 
ON card_purchases(is_paid_current_month);

-- Comentário na coluna para documentação
COMMENT ON COLUMN card_purchases.is_paid_current_month IS 'Indica se a parcela atual da compra foi paga no mês corrente';

