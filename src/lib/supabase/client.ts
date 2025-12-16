import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables not set!')
  console.error('Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
  console.error('See SETUP_SUPABASE.md for instructions')
  throw new Error('Missing Supabase environment variables')
}

// Log para debug (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  console.log('✅ Supabase configured:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
  })
}

// Tipagem será adicionada quando o schema do Supabase for gerado
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

