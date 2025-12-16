# Pulso - Aplicativo de Gestão Financeira Pessoal

Aplicativo web para gerenciamento de finanças pessoais construído com React, TypeScript, Vite, Tailwind CSS, React Query e Supabase.

## 🚀 Tecnologias

- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utility-first
- **React Router** - Roteamento
- **TanStack Query (React Query)** - Gerenciamento de estado do servidor
- **Supabase** - Backend como serviço (BaaS)
- **Zod** - Validação de schemas

## 📁 Estrutura do Projeto

```
/src
├── /components          # Componentes React
│   ├── /ui              # Componentes de UI reutilizáveis
│   ├── /forms           # Formulários específicos
│   ├── /charts          # Gráficos customizados
│   ├── /layouts         # Layouts (Sidebar, Header)
│   └── /shared          # Componentes compartilhados
│
├── /lib                 # Utilitários
│   ├── /supabase        # Cliente Supabase
│   ├── /utils           # Helpers gerais
│   ├── /validations     # Schemas Zod
│   └── /constants       # Constantes
│
├── /hooks               # Custom hooks
│   ├── useTransactions.ts
│   ├── useAccounts.ts
│   └── useCards.ts
│
├── /types               # TypeScript types/interfaces
│   └── index.ts
│
├── /services            # Lógica de negócio
│   ├── transactionService.ts
│   ├── accountService.ts
│   └── cardService.ts
│
├── /pages               # Páginas da aplicação
│   ├── /auth            # Login e Registro
│   └── /dashboard       # Páginas protegidas
│
└── /contexts            # Context providers
    └── QueryProvider.tsx
```

## 🛠️ Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
yarn install
```

3. Configure as variáveis de ambiente:

Crie um arquivo `.env` na raiz do projeto com:

```env
VITE_SUPABASE_URL=https://jeocjbzimlvbswyrtxhv.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

**Para obter a chave ANON_KEY:**
- Acesse: https://supabase.com/dashboard/project/jeocjbzimlvbswyrtxhv
- Vá em Settings > API
- Copie a chave "anon public"

📖 Veja mais detalhes em [SETUP_SUPABASE.md](./SETUP_SUPABASE.md)

Edite `.env.local` e adicione suas credenciais do Supabase:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚦 Scripts

- `yarn dev` - Inicia o servidor de desenvolvimento
- `yarn build` - Cria o build de produção
- `yarn preview` - Preview do build de produção
- `yarn lint` - Executa o linter

## 📋 Funcionalidades

### Implementadas
- ✅ Autenticação (Login/Registro)
- ✅ Estrutura de rotas protegidas
- ✅ Layout com sidebar
- ✅ Configuração do React Query
- ✅ Services para transações, contas e cartões
- ✅ Hooks customizados
- ✅ Validação com Zod

### Em desenvolvimento
- 🔄 CRUD de transações
- 🔄 CRUD de contas bancárias
- 🔄 CRUD de cartões de crédito
- 🔄 Categorias e orçamentos
- 🔄 Metas financeiras
- 🔄 Insights automáticos
- 🔄 Gráficos e relatórios

## 🗄️ Banco de Dados

O projeto utiliza Supabase como backend. As tabelas principais incluem:

- `transactions` - Transações financeiras
- `accounts` - Contas bancárias
- `cards` - Cartões de crédito
- `categories` - Categorias de transações
- `goals` - Metas financeiras

## 📝 Notas

- O projeto usa path aliases (`@/`) para imports mais limpos
- Os tipos do banco de dados devem ser gerados usando o Supabase CLI quando o schema estiver pronto
- O projeto está configurado para TypeScript strict mode

## 📄 Licença

MIT
