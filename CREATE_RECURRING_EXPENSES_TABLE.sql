-- ============================================
-- Query para criar a tabela recurring_expenses
-- Execute no SQL Editor do Supabase
-- ============================================

-- Cria a função update_updated_at_column se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria a tabela recurring_expenses se não existir
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

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_recurring_expenses_updated_at 
  BEFORE UPDATE ON recurring_expenses
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;

-- Policies para recurring_expenses
CREATE POLICY "Users can view their own recurring expenses"
  ON recurring_expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring expenses"
  ON recurring_expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring expenses"
  ON recurring_expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring expenses"
  ON recurring_expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Verifica se a tabela foi criada corretamente
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'recurring_expenses'
ORDER BY ordinal_position;

