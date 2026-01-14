import { supabase } from '@/lib/supabase/client'

export type UserProfile = {
  user_id: string
  full_name: string | null
  monthly_spending_limit: number | null
  onboarding_completed: boolean
  created_at?: string
  updated_at?: string
}

// Allowlist simples para pular onboarding (usuários antigos)
// Se quiser tornar isso configurável, podemos mover para uma env (ex: VITE_SKIP_ONBOARDING_EMAILS)
export const SKIP_ONBOARDING_EMAILS = new Set<string>([
  'thiagolourencosaraiva123@gmail.com',
])

function isSupabaseConfigured() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  return !!url && !url.includes('placeholder')
}

export async function getOnboardingStatus(userId: string | null): Promise<{ completed: boolean }> {
  // Se não há usuário ou Supabase não configurado, considere não concluído
  if (!isSupabaseConfigured() || !userId) return { completed: false }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('user_id', userId)
    .maybeSingle()

  // Em caso de erro ou ausência de linha, considere não concluído
  if (error || !data) return { completed: false }

  return { completed: !!data.onboarding_completed }
}

export async function upsertUserProfile(userId: string | null, profile: Partial<UserProfile>) {
  if (!userId || !isSupabaseConfigured()) return

  const payload = {
    user_id: userId,
    full_name: profile.full_name ?? null,
    monthly_spending_limit: profile.monthly_spending_limit ?? null,
    onboarding_completed: profile.onboarding_completed ?? false,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('user_profiles')
    .upsert(payload, { onConflict: 'user_id' })

  if (error) {
    // fallback
    // writeLocalProfile(profile)
  }
}

export async function setOnboardingCompleted(userId: string | null, completed: boolean) {
  if (!userId || !isSupabaseConfigured()) return

  const { error } = await supabase
    .from('user_profiles')
    .upsert(
      {
        user_id: userId,
        onboarding_completed: completed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (error) {
    // keep local flag
  }
}


