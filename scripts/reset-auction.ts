import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function resetAuction() {
  console.log('=== Resetando leilões ===\n')

  // 1. Delete all bids
  console.log('1. Apagando todos os lances...')
  const { error: bidsError } = await supabase
    .from('bids')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (bidsError) {
    console.error('Erro ao apagar lances:', bidsError.message)
  } else {
    console.log(`   ✅ Lances apagados`)
  }

  // 2. Find Corolla vehicle
  console.log('\n2. Buscando veículo Corolla...')
  const { data: corolla, error: findError } = await supabase
    .from('vehicles')
    .select('id, title, status, current_price, starting_price')
    .ilike('title', '%corolla%')
    .single()

  if (findError || !corolla) {
    console.error('Corolla não encontrado:', findError?.message)
    return
  }

  console.log(`   Encontrado: ${corolla.title}`)
  console.log(`   Status atual: ${corolla.status}`)

  // 3. Reset Corolla to scheduled
  console.log('\n3. Atualizando Corolla para agendado...')
  const { error: updateError } = await supabase
    .from('vehicles')
    .update({
      status: 'scheduled',
      current_price: corolla.starting_price,
      winner_id: null,
      final_price: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', corolla.id)

  if (updateError) {
    console.error('Erro ao atualizar:', updateError.message)
  } else {
    console.log('   ✅ Corolla atualizado para status "scheduled"')
    console.log(`   Preço resetado para: R$ ${corolla.starting_price}`)
  }

  // 4. Delete notifications related to bids
  console.log('\n4. Apagando notificações de lances...')
  const { error: notifError } = await supabase
    .from('notifications')
    .delete()
    .in('type', ['outbid', 'winner'])

  if (notifError) {
    console.error('Erro ao apagar notificações:', notifError.message)
  } else {
    console.log('   ✅ Notificações apagadas')
  }

  console.log('\n=== Reset concluído! ===')
}

resetAuction()
