import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateAdmin } from '@/lib/auth/validateAdmin'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST - End auction manually (admin only)
export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  // Check auth and admin status
  const adminCheck = await validateAdmin(supabase)
  if (!adminCheck.success) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
  }

  // Get vehicle
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single()

  if (vehicleError || !vehicle) {
    return NextResponse.json({ error: 'Veiculo nao encontrado' }, { status: 404 })
  }

  if (vehicle.status !== 'active') {
    return NextResponse.json({ error: 'Este leilao nao esta ativo' }, { status: 400 })
  }

  // Get highest bid
  const { data: highestBid } = await supabase
    .from('bids')
    .select('*')
    .eq('vehicle_id', id)
    .order('amount', { ascending: false })
    .limit(1)
    .single()

  // Update vehicle
  const adminClient = createAdminClient()
  const { error: updateError } = await adminClient
    .from('vehicles')
    .update({
      status: 'ended',
      winner_id: highestBid?.user_id || null,
      final_price: highestBid?.amount || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Send notification to winner
  if (highestBid) {
    await adminClient.from('notifications').insert({
      user_id: highestBid.user_id,
      type: 'winner',
      message: `Parabens! Voce venceu o leilao do ${vehicle.title}`,
      vehicle_id: id,
    })
  }

  return NextResponse.json({ success: true })
}
