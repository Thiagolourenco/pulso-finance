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

const LS_KEY = 'pulso:user_profile'
const LS_ONBOARDING_KEY = 'pulso:onboarding_completed'

function isSupabaseConfigured() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  return !!url && !url.includes('placeholder')
}

function readLocalProfile(): Partial<UserProfile> | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Partial<UserProfile>
  } catch {
    return null
  }
}

function writeLocalProfile(profile: Partial<UserProfile>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(profile))
  } catch {
    // ignore
  }
}

export async function getOnboardingStatus(userId: string | null): Promise<{ completed: boolean }> {
  // Fallback/local mode (sem Supabase real)
  if (!isSupabaseConfigured() || !userId) {
    const localFlag = localStorage.getItem(LS_ONBOARDING_KEY)
    return { completed: localFlag === 'true' }
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('user_id', userId)
    .maybeSingle()

  // Se a tabela ainda não existir, ou ocorrer erro, cai pro localStorage para não travar o app
  if (error) {
    const localFlag = localStorage.getItem(LS_ONBOARDING_KEY)
    return { completed: localFlag === 'true' }
  }

  return { completed: !!data?.onboarding_completed }
}

export async function upsertUserProfile(userId: string | null, profile: Partial<UserProfile>) {
  if (!userId || !isSupabaseConfigured()) {
    writeLocalProfile(profile)
    return
  }

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
    writeLocalProfile(profile)
  }
}

export async function setOnboardingCompleted(userId: string | null, completed: boolean) {
  try {
    localStorage.setItem(LS_ONBOARDING_KEY, completed ? 'true' : 'false')
  } catch {
    // ignore
  }

  const local = readLocalProfile() || {}
  writeLocalProfile({ ...local, onboarding_completed: completed })

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


