# 🗄️ Setup do Banco de Dados - Pulso

Este guia explica como configurar o banco de dados no Supabase para o aplicativo Pulso.

## 📋 Pré-requisitos

1. Conta no Supabase criada
2. Projeto criado no Supabase
3. URL e chave de API configuradas no `.env`

## 🚀 Passo a Passo

### 1. Acesse o SQL Editor do Supabase

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**

### 2. Execute o Script SQL

1. Abra o arquivo `supabase_schema.sql` neste projeto
2. Copie todo o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione `Ctrl/Cmd + Enter`)

### 3. Verifique se as Tabelas Foram Criadas

1. No menu lateral, clique em **Table Editor**
2. Você deve ver as seguintes tabelas:
   - ✅ `categories`
   - ✅ `accounts`
   - ✅ `cards`
   - ✅ `transactions`
   - ✅ `card_purchases`
   - ✅ `card_invoices`
   - ✅ `goals`

## 📊 Estrutura das Tabelas

### `categories`
- **Campos principais**: `id`, `user_id`, `name`, `type` (expense/income), `icon`, `color`, `parent_id`
- **Constraints**: `type` obrigatório, único por usuário (`user_id`, `name`)

### `accounts`
- **Campos principais**: `id`, `user_id`, `name`, `type` (bank/cash/investment/wallet), `initial_balance`, `current_balance`
- **Constraints**: `type` obrigatório

### `cards`
- **Campos principais**: `id`, `user_id`, `name`, `credit_limit`, `closing_day`, `due_day`
- **Constraints**: `closing_day` e `due_day` entre 1 e 31

### `transactions`
- **Campos principais**: `id`, `user_id`, `account_id`, `card_id`, `category_id`, `amount`, `description`, `type`, `date`
- **Constraints**: `category_id` obrigatório, `type` (income/expense)

### `card_purchases`
- **Campos principais**: `id`, `user_id`, `card_id`, `description`, `total_amount`, `installments`, `installment_amount`, `current_installment`, `purchase_date`, `category_id`
- **Constraints**: `installments >= 1`, `current_installment <= installments`

### `card_invoices`
- **Campos principais**: `id`, `user_id`, `card_id`, `reference_month`, `closing_date`, `due_date`, `status` (open/closed/paid), `total_amount`
- **Constraints**: `status` obrigatório, único por cartão e mês (`card_id`, `reference_month`)

### `goals`
- **Campos principais**: `id`, `user_id`, `name`, `target_amount`, `current_amount`, `target_date`
- **Constraints**: `target_amount` obrigatório

## 🔒 Segurança (RLS)

O script habilita **Row Level Security (RLS)** em todas as tabelas e cria políticas que garantem:

- ✅ Usuários só podem ver seus próprios dados
- ✅ Usuários só podem criar dados para si mesmos
- ✅ Usuários só podem atualizar seus próprios dados
- ✅ Usuários só podem deletar seus próprios dados

## 🔄 Triggers Automáticos

O script cria triggers que atualizam automaticamente o campo `updated_at` quando qualquer registro é modificado.

## ⚠️ Importante

- **Não execute o script duas vezes** se as tabelas já existirem (use `CREATE TABLE IF NOT EXISTS`)
- Se precisar recriar as tabelas, **delete-as primeiro** no Table Editor
- O script usa `ON DELETE CASCADE` para garantir que dados relacionados sejam removidos automaticamente

## 🐛 Troubleshooting

### Erro: "relation already exists"
- As tabelas já existem. Você pode:
  1. Deletar as tabelas manualmente no Table Editor
  2. Ou usar `DROP TABLE IF EXISTS` antes de criar

### Erro: "permission denied"
- Verifique se você está logado como administrador do projeto
- Certifique-se de ter permissões de administrador no Supabase

### Erro: "foreign key constraint"
- Certifique-se de que a tabela `auth.users` existe (criada automaticamente pelo Supabase)

## ✅ Verificação Final

Após executar o script, teste criando:

1. Uma categoria
2. Uma conta
3. Um cartão
4. Uma transação
5. Uma compra no cartão

Se tudo funcionar, o banco está configurado corretamente! 🎉







