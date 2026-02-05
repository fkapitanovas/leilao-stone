import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOutbidEmail } from '@/lib/email'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const bidSchema = z.object({
  vehicle_id: z.string().uuid(),
  amount: z.number().positive(),
})

export async function POST(request: Request) {
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Faca login para dar lances' }, { status: 401 })
  }

  // Validate body
  const body = await request.json()
  const result = bidSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Dados invalidos', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const { vehicle_id, amount } = result.data

  // Get vehicle with lock
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicle_id)
    .single()

  if (vehicleError || !vehicle) {
    return NextResponse.json({ error: 'Veiculo nao encontrado' }, { status: 404 })
  }

  // Validate auction is active
  if (vehicle.status !== 'active') {
    return NextResponse.json({ error: 'Este leilao nao esta ativo' }, { status: 400 })
  }

  // Validate auction hasn't ended
  const now = new Date()
  const auctionEnd = new Date(vehicle.auction_end)
  if (now > auctionEnd) {
    return NextResponse.json({ error: 'Este leilao ja encerrou' }, { status: 400 })
  }

  // Validate bid amount
  const minBid = vehicle.current_price + vehicle.min_bid_increment
  if (amount < minBid) {
    return NextResponse.json(
      { error: `O lance minimo e R$ ${minBid.toFixed(2)}` },
      { status: 400 }
    )
  }

  // Get previous highest bidder
  const { data: previousBid } = await supabase
    .from('bids')
    .select('user_id')
    .eq('vehicle_id', vehicle_id)
    .order('amount', { ascending: false })
    .limit(1)
    .single()

  // Use admin client for write operations
  const adminClient = createAdminClient()

  // Create bid
  const { data: bid, error: bidError } = await adminClient
    .from('bids')
    .insert({
      vehicle_id,
      user_id: user.id,
      amount,
    })
    .select()
    .single()

  if (bidError) {
    return NextResponse.json({ error: bidError.message }, { status: 500 })
  }

  // Update vehicle current price
  await adminClient
    .from('vehicles')
    .update({
      current_price: amount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', vehicle_id)

  // Notify previous highest bidder (if different from current)
  if (previousBid && previousBid.user_id !== user.id) {
    await adminClient.from('notifications').insert({
      user_id: previousBid.user_id,
      type: 'outbid',
      message: `Voce foi superado no leilao do ${vehicle.title}`,
      vehicle_id,
    })

    // Send email notification
    const { data: profile } = await adminClient
      .from('profiles')
      .select('email')
      .eq('id', previousBid.user_id)
      .single()

    if (profile?.email) {
      sendOutbidEmail(profile.email, vehicle.title, amount).catch(console.error)
    }
  }

  return NextResponse.json(bid, { status: 201 })
}
