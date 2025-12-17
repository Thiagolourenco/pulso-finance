-- ============================================
-- Script SQL para criar as tabelas do Pulso
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- ============================================
-- 1. Tabela: categories
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  icon TEXT,
  color TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Índices para categories
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- ============================================
-- 2. Tabela: accounts
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bank', 'cash', 'investment', 'wallet')),
  initial_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para accounts
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);

-- ============================================
-- 3. Tabela: cards
-- ============================================
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  credit_limit NUMERIC(12, 2) NOT NULL,
  closing_day INTEGER NOT NULL CHECK (closing_day >= 1 AND closing_day <= 31),
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para cards
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);

-- ============================================
-- 4. Tabela: transactions
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- ============================================
-- 5. Tabela: card_purchases
-- ============================================
CREATE TABLE IF NOT EXISTS card_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  installments INTEGER NOT NULL CHECK (installments >= 1),
  installment_amount NUMERIC(12, 2) NOT NULL,
  current_installment INTEGER NOT NULL DEFAULT 1 CHECK (current_installment >= 1),
  purchase_date DATE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (current_installment <= installments)
);

-- Índices para card_purchases
CREATE INDEX IF NOT EXISTS idx_card_purchases_user_id ON card_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_card_purchases_card_id ON card_purchases(card_id);
CREATE INDEX IF NOT EXISTS idx_card_purchases_category_id ON card_purchases(category_id);
CREATE INDEX IF NOT EXISTS idx_card_purchases_purchase_date ON card_purchases(purchase_date);

-- ============================================
-- 6. Tabela: card_invoices
-- ============================================
CREATE TABLE IF NOT EXISTS card_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  reference_month DATE NOT NULL,
  closing_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'paid')),
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(card_id, reference_month)
);

-- Índices para card_invoices
CREATE INDEX IF NOT EXISTS idx_card_invoices_user_id ON card_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_card_invoices_card_id ON card_invoices(card_id);
CREATE INDEX IF NOT EXISTS idx_card_invoices_status ON card_invoices(status);
CREATE INDEX IF NOT EXISTS idx_card_invoices_reference_month ON card_invoices(reference_month);

-- ============================================
-- 7. Tabela: goals
-- ============================================
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL,
  current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para goals
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- ============================================
-- 8. Tabela: recurring_expenses
-- ============================================
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para recurring_expenses
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_user_id ON recurring_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_category_id ON recurring_expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_account_id ON recurring_expenses(account_id);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_is_active ON recurring_expenses(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_due_day ON recurring_expenses(due_day);

-- ============================================
-- Função para atualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_purchases_updated_at BEFORE UPDATE ON card_purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_invoices_updated_at BEFORE UPDATE ON card_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;

-- Policy: categories
CREATE POLICY "Users can view their own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: accounts
CREATE POLICY "Users can view their own accounts"
  ON accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts"
  ON accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
  ON accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
  ON accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: cards
CREATE POLICY "Users can view their own cards"
  ON cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cards"
  ON cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards"
  ON cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards"
  ON cards FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: card_purchases
CREATE POLICY "Users can view their own card purchases"
  ON card_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own card purchases"
  ON card_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own card purchases"
  ON card_purchases FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own card purchases"
  ON card_purchases FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: card_invoices
CREATE POLICY "Users can view their own card invoices"
  ON card_invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own card invoices"
  ON card_invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own card invoices"
  ON card_invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own card invoices"
  ON card_invoices FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: goals
CREATE POLICY "Users can view their own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Fim do script
-- ============================================

