# 🔄 Migração da Tabela Goals

Este script atualiza a tabela `goals` para usar a coluna `target_date` ao invés de `deadline` (se existir).

## 📋 Como executar

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `migrate_goals_table.sql`
4. Clique em **Run** ou pressione `Ctrl+Enter`

## ✅ O que o script faz

- ✅ Verifica se a coluna `target_date` existe
- ✅ Se não existir, adiciona a coluna
- ✅ Se existir uma coluna `deadline`, migra os dados para `target_date` e remove `deadline`
- ✅ Garante que `current_amount` existe e tem valor padrão 0
- ✅ Cria índice em `target_date` para melhor performance
- ✅ Valida que todas as colunas necessárias estão presentes

## ⚠️ Importante

- O script é **idempotente** (pode ser executado múltiplas vezes sem problemas)
- **Não perde dados** - se houver `deadline`, os dados são migrados para `target_date`
- Se algo der errado, você verá uma mensagem de erro clara

## 🔍 Verificar após a migração

Execute esta query para verificar se tudo está correto:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'goals'
ORDER BY ordinal_position;
```

Você deve ver:
- `id` (uuid)
- `user_id` (uuid)
- `name` (text)
- `target_amount` (numeric)
- `current_amount` (numeric, default 0)
- `target_date` (date, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)








