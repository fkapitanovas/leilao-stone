import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function addAdmin(email: string) {
  console.log(`Buscando usuário: ${email}`)

  // Find user by email in profiles
  const { data: profile, error: findError } = await supabase
    .from('profiles')
    .select('id, email, name, is_admin')
    .eq('email', email)
    .single()

  if (findError || !profile) {
    console.error('Usuário não encontrado:', findError?.message || 'Email não existe')
    process.exit(1)
  }

  console.log(`Usuário encontrado: ${profile.name || profile.email}`)
  console.log(`Admin atual: ${profile.is_admin}`)

  if (profile.is_admin) {
    console.log('Usuário já é admin!')
    return
  }

  // Update to admin
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ is_admin: true })
    .eq('id', profile.id)

  if (updateError) {
    console.error('Erro ao atualizar:', updateError.message)
    process.exit(1)
  }

  console.log('✅ Usuário promovido a admin com sucesso!')
}

const email = process.argv[2]
if (!email) {
  console.error('Uso: npx tsx scripts/add-admin.ts email@exemplo.com')
  process.exit(1)
}

addAdmin(email)
