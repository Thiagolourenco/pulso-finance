import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔵 [Supabase Client] Verificando variáveis de ambiente...')
console.log('🔵 [Supabase Client] VITE_SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'NÃO DEFINIDA')
console.log('🔵 [Supabase Client] VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NÃO DEFINIDA')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ [Supabase Client] Variáveis de ambiente não configuradas!')
  console.error('❌ [Supabase Client] VITE_SUPABASE_URL:', supabaseUrl)
  console.error('❌ [Supabase Client] VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'DEFINIDA' : 'NÃO DEFINIDA')
  console.error('Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
  console.error('See SETUP_SUPABASE.md for instructions')
  throw new Error('Missing Supabase environment variables')
}

// Log para debug (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  console.log('✅ [Supabase Client] Supabase configurado:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
    keyLength: supabaseAnonKey?.length || 0,
  })
}

// Tipagem será adicionada quando o schema do Supabase for gerado
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

