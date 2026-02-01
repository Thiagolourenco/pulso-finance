# Análise do Erro de Lógica no Dashboard

## Contexto
- **Janeiro**: Relatório mostrava Receitas R$ 24.613,75, Despesas R$ 16.274,07, Saldo +R$ 8.339,68
- **1º de fevereiro**: Ao entrar no app, Receitas R$ 0, Despesas R$ 5.593,37, Sobra prevista negativa
- **Usuário**: Nunca marcou faturas ou financiamentos como pagos

---

## Causa Raiz

### 1. Virou o mês = mudou o cálculo

No **1º de fevereiro**:
- **Receitas do mês** = R$ 0 (correto – ainda não há transações em fevereiro)
- **Despesas do mês** = R$ 5.593,37 (faturas que vencem em fev + despesas recorrentes de fev)

Ou seja: receita zerada, despesas cheias.

### 2. Fórmula antiga (antes do ajuste)

```
Sobra prevista = Receitas do mês - Despesas do mês
               = 0 - 5.593,37
               = -R$ 5.593,37
```

A sobra prevista ficava fortemente negativa logo no primeiro dia do mês.

### 3. De onde vêm os R$ 5.593,37

As **“Despesas do mês”** incluem:
- Faturas de cartão que **vencem em fevereiro** (ex.: Banco Inter R$ 2.680, Porto seguro R$ 352)
- Despesas recorrentes que **vencem em fevereiro** (ex.: Financiamento R$ 2.361, Internet R$ 200)

Ou seja, são **obrigações esperadas** de fevereiro, não o que você já pagou. O app conta tudo que vence no mês, esteja pago ou não.

---

## Correção aplicada

Foi feita uma alteração na lógica:

- **Antes**: Sobra prevista = Receitas do mês - Despesas do mês  
  → Em fevereiro: 0 - 5.593 = -5.593

- **Depois**: Se **Receitas do mês = 0**, usamos a receita do mês anterior como projeção:
  - Sobra prevista = Receitas de jan - Despesas de fev  
  - Sobra prevista = 24.613 - 5.593 ≈ **+R$ 19.020**

Assim, no 1º dia do mês o app não mostra mais sobra fortemente negativa sem que nada tenha sido adicionado.

---

## Resumo

| Item                          | Antes do ajuste | Depois do ajuste  |
|------------------------------|-----------------|-------------------|
| Receitas do mês (1º fev)     | R$ 0            | R$ 0              |
| Despesas do mês              | R$ 5.593        | R$ 5.593          |
| Sobra prevista               | -R$ 5.593       | ~+R$ 19.020       |
| Sensação ao abrir o app      | Saldo “caiu”    | Mais coerente     |

A lógica de **despesas** (incluir faturas e recorrentes pelo vencimento) está correta; o problema era apenas o uso de receita zerada no início do mês para a sobra prevista. O ajuste já foi feito no código.
