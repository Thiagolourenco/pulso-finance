# 🚀 Começando a Implementação com Supabase

Agora vamos começar a implementar o Supabase no seu projeto!  
Nesta documentação você encontra **tudo que precisa para usar o Supabase** no seu app financeiro, desde a estrutura das tabelas, exemplos de uso e os fluxos mais comuns.

---

## 📚 Visão Geral

O Supabase será responsável por gerenciar seus dados, autenticação de usuários e toda a base do Finance App.  
Aqui estão as tabelas e como cada uma delas é utilizada.

---

## 🗂️ Tabelas Principais

1. **user_profiles**: Informações de perfil do usuário
2. **accounts**: Contas bancárias, carteira e investimentos
3. **categories**: Categorias e subcategorias de receitas/despesas
4. **cards**: Cartões de crédito
5. **transactions**: Transações comuns (gastos, receitas, transferências)
6. **card_purchases**: Compras feitas no cartão de crédito (inclusive parceladas)
7. **card_invoices**: Faturas mensais do cartão
8. **goals**: Metas financeiras
9. **budget_tracking**: Controle de orçamento por categoria/mês
10. **insights_cache**: Cache de relatórios e insights
11. **audit_log**: Log de auditoria para rastrear alterações

---

## Como Usar Cada Tabela?

### 1. user_profiles
- **Para quê?**: Guardar dados do usuário além do auth (nome, moeda, salário, preferências)
- **Sugestão**: Crie imediatamente após o signup.
- **Exemplo**:
    ```typescript
    await supabase.from('user_profiles').insert({
      id: user.id,
      full_name: 'Maria Souza',
      currency: 'BRL',
      salary_day: 5
    });
    ```

### 2. accounts
- **Para quê?**: Cada conta separada e seu saldo.
- **Exemplo**:
    ```typescript
    // Nova conta
    await supabase.from('accounts').insert({
      user_id: user.id,
      name: 'Carteira',
      type: 'cash',
      initial_balance: 200.00,
      current_balance: 200.00
    });
    ```

### 3. categories
- **Para quê?**: Organizar receitas/gastos (pode ter subcategoria).
- **Exemplo**:
    ```typescript
    await supabase.from('categories').insert({
      user_id: user.id,
      name: 'Alimentação',
      type: 'expense'
    });
    ```

### 4. cards
- **Para quê?**: Registrar cartões de crédito, limites, datas.
- **Exemplo**:
    ```typescript
    await supabase.from('cards').insert({
      user_id: user.id,
      name: 'Nubank Roxo',
      credit_limit: 3000,
      closing_day: 10,
      due_day: 17
    });
    ```

### 5. transactions
- **Para quê?**: Transações diretas, transferências, receitas.
- **Exemplo**:
    ```typescript
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'expense',
      account_id: 'uuid-da-conta',
      category_id: 'uuid-categoria',
      amount: 150.00,
      date: '2025-12-12'
    });
    ```

### 6. card_purchases
- **Para quê?**: Todas as compras feitas no cartão (incluindo parcelado).
- **Exemplo**:
    ```typescript
    await supabase.from('card_purchases').insert({
      user_id: user.id,
      card_id: 'uuid-cartao',
      description: 'Notebook',
      total_amount: 3000.00,
      installments: 10,
      installment_amount: 300.00,
      purchase_date: '2025-12-10'
    });
    ```

### 7. card_invoices
- **Para quê?**: Controle de faturas do cartão abertas/fechadas/pagas.
- **Exemplo**:
    ```typescript
    await supabase.from('card_invoices').insert({
      user_id: user.id,
      card_id: 'uuid-cartao',
      reference_month: '2025-12-01',
      closing_date: '2025-12-10',
      due_date: '2025-12-17',
      status: 'open'
    });
    ```

### 8. goals
- **Para quê?**: Para acompanhar metas de economia.
- **Exemplo**:
    ```typescript
    await supabase.from('goals').insert({
      user_id: user.id,
      name: 'Viagem 2026',
      target_amount: 5000,
      current_amount: 0,
      deadline: '2026-12-31'
    });
    ```

### 9. budget_tracking
- **Para quê?**: Orçamento mensal por categoria.
- **Exemplo**:
    ```typescript
    await supabase.from('budget_tracking').insert({
      user_id: user.id,
      category_id: 'uuid-alimentacao',
      month: '2025-12-01',
      planned_amount: 800.00,
      spent_amount: 0
    });
    ```

### 10. insights_cache
- **Para quê?**: Armazenar resultados de análises pesadas para acelerar o dashboard.

### 11. audit_log
- **Para quê?**: Controlar alterações e ações de segurança.

---

## ⚡️ Fluxos Comuns

### Como registrar uma despesa simples:
1. Adicione no `transactions` com tipo `'expense'`.
2. O saldo será atualizado automaticamente.

### Como registrar compra no cartão:
1. Adicione no `card_purchases`.
2. Ela será vinculada à próxima fatura aberta.

### Para transferir entre contas:
1. Use `transactions` com tipo `'transfer'`, preenchendo a conta origem e destino.

### Para pagar uma fatura de cartão:
1. Atualize a fatura (`card_invoices`) para `'paid'`.
2. Crie uma despesa em `transactions` debitando da conta vinculada ao cartão.

---

## ✅ Checklist de Tabelas Mínimas

- [x] `user_profiles`
- [x] `accounts`
- [x] `categories`
- [x] `transactions`
- [x] `cards` *(opcional para MVP)*
- [x] `card_purchases` *(opcional para MVP)*

---

## 👉 Próximos Passos

1. Copie o **SQL** para criar as tabelas no Supabase SQL Editor.
2. Execute o script para estruturar o banco.
3. Teste operações básicas de inserção/consulta pelo Dashboard do Supabase.
4. Implemente CRUDs do seu app utilizando os exemplos acima.

> **Dúvidas sobre uma tabela ou uso específico?  
> Me avise e te explico detalhadamente!**