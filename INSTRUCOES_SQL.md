# Instruções para Executar o Script SQL

## ⚠️ IMPORTANTE: Execute este script no Supabase SQL Editor

O erro "column recurring_expenses.is_paid_current_month does not exist" acontece porque a coluna ainda não foi criada no banco de dados.

### Passo a Passo:

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute o script COMPLETO abaixo:**

```sql
-- Remove índices se existirem
DROP INDEX IF EXISTS idx_recurring_expenses_is_paid_current_month;
DROP INDEX IF EXISTS idx_recurring_expenses_transaction_id;

-- Remove e recria as colunas
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_expenses' 
    AND column_name = 'is_paid_current_month'
  ) THEN
    ALTER TABLE recurring_expenses DROP COLUMN is_paid_current_month CASCADE;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_expenses' 
    AND column_name = 'transaction_id'
  ) THEN
    ALTER TABLE recurring_expenses DROP COLUMN transaction_id CASCADE;
  END IF;
END $$;

-- Cria as colunas
ALTER TABLE recurring_expenses
ADD COLUMN is_paid_current_month BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE recurring_expenses
ADD COLUMN transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL;

-- Cria índices
CREATE INDEX idx_recurring_expenses_is_paid_current_month 
ON recurring_expenses(is_paid_current_month);

CREATE INDEX idx_recurring_expenses_transaction_id 
ON recurring_expenses(transaction_id);

-- Verifica se funcionou (deve retornar 2 linhas)
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'recurring_expenses'
  AND column_name IN ('is_paid_current_month', 'transaction_id');
```

4. **Após executar:**
   - Aguarde 10-15 segundos
   - Feche e abra o navegador (ou limpe o cache)
   - Recarregue a página do app
   - Teste novamente

### Se ainda não funcionar:

Execute este script de verificação para ver o que está no banco:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'recurring_expenses'
ORDER BY column_name;
```

Isso mostrará todas as colunas da tabela. Se `is_paid_current_month` não aparecer, o script não foi executado corretamente.

