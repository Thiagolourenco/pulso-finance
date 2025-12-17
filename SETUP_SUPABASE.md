# 🔧 Configuração do Supabase

## Informações do Projeto

- **Project ID**: `jeocjbzimlvbswyrtxhv`
- **Project Name**: `pulsoFinance`
- **URL**: `https://jeocjbzimlvbswyrtxhv.supabase.co`

## 📝 Como configurar

1. **Crie um arquivo `.env` na raiz do projeto:**

```bash
# Na raiz do projeto
touch .env
```

2. **Adicione as seguintes variáveis no arquivo `.env`:**

```env
VITE_SUPABASE_URL=https://jeocjbzimlvbswyrtxhv.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

3. **Para obter a `VITE_SUPABASE_ANON_KEY`:**

   - Acesse: https://supabase.com/dashboard/project/jeocjbzimlvbswyrtxhv
   - Vá em **Settings** > **API**
   - Copie a chave **"anon public"** (não a "service_role" secret key!)

4. **Reinicie o servidor de desenvolvimento:**

```bash
yarn dev
```

## ✅ Verificação

Após configurar, você deve ver no console do navegador que não há mais o aviso sobre variáveis de ambiente não configuradas.

## 🔒 Segurança

- ⚠️ **NUNCA** commite o arquivo `.env` no Git
- O arquivo `.env` já está no `.gitignore`
- Use apenas a chave **anon public** no frontend
- A chave **service_role** deve ser usada apenas no backend (nunca no frontend!)







