-- ============================================
-- Origem Pessoal/Empresa e status de reembolso
-- OBRIGATÓRIO: rode no SQL Editor do Supabase
-- (Table Editor > SQL > New query > Run)
-- Sem isso o app quebra com PGRST204: origin column
-- ============================================

-- transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'personal';

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS reimbursement_status TEXT;

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_origin_check;
ALTER TABLE transactions
ADD CONSTRAINT transactions_origin_check CHECK (origin IN ('personal', 'company'));

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_reimbursement_status_check;
ALTER TABLE transactions
ADD CONSTRAINT transactions_reimbursement_status_check
CHECK (reimbursement_status IS NULL OR reimbursement_status IN ('pending', 'reimbursed'));

CREATE INDEX IF NOT EXISTS idx_transactions_origin ON transactions(origin);
CREATE INDEX IF NOT EXISTS idx_transactions_reimbursement_status ON transactions(reimbursement_status);

-- card_purchases
ALTER TABLE card_purchases
ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'personal';

ALTER TABLE card_purchases
ADD COLUMN IF NOT EXISTS reimbursement_status TEXT;

ALTER TABLE card_purchases DROP CONSTRAINT IF EXISTS card_purchases_origin_check;
ALTER TABLE card_purchases
ADD CONSTRAINT card_purchases_origin_check CHECK (origin IN ('personal', 'company'));

ALTER TABLE card_purchases DROP CONSTRAINT IF EXISTS card_purchases_reimbursement_status_check;
ALTER TABLE card_purchases
ADD CONSTRAINT card_purchases_reimbursement_status_check
CHECK (reimbursement_status IS NULL OR reimbursement_status IN ('pending', 'reimbursed'));

CREATE INDEX IF NOT EXISTS idx_card_purchases_origin ON card_purchases(origin);
CREATE INDEX IF NOT EXISTS idx_card_purchases_reimbursement_status ON card_purchases(reimbursement_status);

COMMENT ON COLUMN transactions.origin IS 'personal = gasto/receita pessoal; company = gasto da empresa (reembolsável)';
COMMENT ON COLUMN transactions.reimbursement_status IS 'Só para origin=company: pending ou reimbursed';
COMMENT ON COLUMN card_purchases.origin IS 'personal = compra pessoal; company = compra da empresa (reembolsável)';
COMMENT ON COLUMN card_purchases.reimbursement_status IS 'Só para origin=company: pending ou reimbursed';

NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

SELECT table_name, column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('transactions', 'card_purchases')
  AND column_name IN ('origin', 'reimbursement_status')
ORDER BY table_name, column_name;
