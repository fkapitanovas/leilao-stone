import { SupabaseClient } from '@supabase/supabase-js'

export type AdminValidationResult =
  | { success: true; userId: string }
  | { success: false; error: string; status: number }

/**
 * Validates that the current user is authenticated and has admin privileges.
 * Includes proper error handling and logging for security monitoring.
 */
export async function validateAdmin(
  supabase: SupabaseClient
): Promise<AdminValidationResult> {
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) {
    console.error('[Auth] Error getting user:', authError.message)
    return { success: false, error: 'Erro de autenticacao', status: 401 }
  }

  if (!user) {
    return { success: false, error: 'Nao autorizado', status: 401 }
  }

  // Check admin status
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('[Auth] Error fetching profile for user:', user.id, profileError.message)
    return { success: false, error: 'Erro ao verificar permissoes', status: 500 }
  }

  if (!profile) {
    console.warn('[Auth] No profile found for user:', user.id)
    return { success: false, error: 'Perfil nao encontrado', status: 403 }
  }

  if (!profile.is_admin) {
    console.warn('[Auth] Unauthorized admin access attempt by user:', user.id)
    return { success: false, error: 'Acesso negado', status: 403 }
  }

  return { success: true, userId: user.id }
}
