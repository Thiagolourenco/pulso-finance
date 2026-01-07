# 🔧 Solução para Erro de Cache do Schema do Supabase

## Erro: "Could not find the 'monthly_limit' column of 'categories' in the schema cache"

Este erro ocorre quando o Supabase ainda não atualizou o cache interno do schema após adicionar uma nova coluna.

## ✅ Solução Passo a Passo

### 1. Execute o Script SQL

Execute o arquivo `FIX_MONTHLY_LIMIT_COLUMN.sql` no SQL Editor do Supabase.

### 2. Aguarde alguns segundos

O Supabase leva alguns segundos (até 1 minuto) para atualizar o cache do schema.

### 3. Force o Refresh do Cache

Se o erro persistir, tente uma das seguintes soluções:

#### Opção A: Recarregar a página do Supabase Dashboard
- Feche e abra novamente o SQL Editor
- Ou recarregue a página do Dashboard do Supabase

#### Opção B: Verificar se a coluna foi criada
Execute este SQL para verificar:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'categories' 
AND column_name = 'monthly_limit';
```

Se retornar uma linha, a coluna existe. O problema é apenas cache.

#### Opção C: Forçar atualização fazendo uma query simples
Execute este SQL para forçar o Supabase a atualizar o cache:

```sql
SELECT id, name, monthly_limit 
FROM categories 
LIMIT 1;
```

#### Opção D: Reiniciar o servidor de desenvolvimento
1. Pare o servidor (Ctrl+C)
2. Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)
3. Reinicie o servidor: `npm run dev` ou `yarn dev`

### 4. Verificar no Table Editor

1. Vá em **Table Editor** no Supabase Dashboard
2. Selecione a tabela `categories`
3. Verifique se a coluna `monthly_limit` aparece na lista de colunas

Se a coluna aparecer no Table Editor, o problema é apenas cache do TypeScript/JavaScript.

## 🚨 Se Nada Funcionar

Se após todas essas tentativas o erro persistir:

1. **Verifique se você está usando o projeto correto do Supabase**
   - Confirme que as variáveis de ambiente `.env` estão corretas
   - Verifique se `VITE_SUPABASE_URL` aponta para o projeto certo

2. **Verifique as permissões RLS (Row Level Security)**
   - A coluna pode estar criada, mas as políticas RLS podem estar bloqueando
   - Execute: `SELECT * FROM categories LIMIT 1;` para testar

3. **Contate o suporte do Supabase**
   - Se a coluna existe mas o cache não atualiza, pode ser um problema do Supabase

## 📝 Nota Importante

O cache do schema do Supabase pode levar até **2-3 minutos** para atualizar completamente. Se você acabou de executar o SQL, aguarde um pouco antes de testar novamente.

