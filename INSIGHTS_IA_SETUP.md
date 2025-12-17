# 🤖 Configuração de Insights com IA

## Visão Geral

A funcionalidade de Insights Inteligentes usa a API da OpenAI para gerar análises personalizadas sobre suas finanças, incluindo:
- Comparações com meses anteriores
- Alertas sobre despesas altas
- Oportunidades de economia
- Recomendações personalizadas

## ⚙️ Configuração

### 1. Obter API Key da OpenAI

1. Acesse: https://platform.openai.com/api-keys
2. Faça login ou crie uma conta
3. Clique em "Create new secret key"
4. Copie a chave gerada (ela começa com `sk-`)

### 2. Configurar Variável de Ambiente

Crie um arquivo `.env` na raiz do projeto (se ainda não existir) e adicione:

```env
VITE_OPENAI_API_KEY=sk-sua-chave-aqui
```

**Importante**: 
- O arquivo `.env` não deve ser commitado no Git (já está no .gitignore)
- Nunca compartilhe sua API key publicamente
- A chave será usada apenas no frontend (Vite expõe variáveis `VITE_*`)

### 3. Reiniciar o Servidor

Após adicionar a variável de ambiente, reinicie o servidor de desenvolvimento:

```bash
npm run dev
# ou
yarn dev
```

## 💡 Como Funciona

### Com API Key (Insights com IA)
- Usa GPT-4o-mini para gerar insights personalizados
- Análise mais profunda e contextualizada
- Recomendações específicas baseadas nos seus dados

### Sem API Key (Insights Básicos)
- Gera insights básicos usando regras pré-definidas
- Funciona sem custo adicional
- Menos personalizado, mas ainda útil

## 💰 Custos

A OpenAI cobra por uso da API:
- **Modelo usado**: GPT-4o-mini (mais econômico)
- **Custo aproximado**: ~$0.15 por 1M tokens de entrada, ~$0.60 por 1M tokens de saída
- **Uso típico**: Cada geração de insights usa ~500-1000 tokens
- **Custo por insight**: ~$0.0005 - $0.001 (menos de 1 centavo)

## 🔒 Segurança

- A API key é armazenada apenas no frontend
- As requisições são feitas diretamente do navegador para a OpenAI
- Nenhum dado financeiro é armazenado pela OpenAI
- Os dados são enviados apenas para gerar os insights

## 🚀 Melhorias Futuras

- Cache de insights para reduzir custos
- Opção de usar modelos locais (Ollama, etc.)
- Insights mais detalhados por categoria
- Previsões de tendências






