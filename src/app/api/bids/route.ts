import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOutbidEmail } from '@/lib/email'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const bidSchema = z.object({
  vehicle_id: z.string().uuid(),
  amount: z.number().positive(),
})

const cancelBidSchema = z.object({
  bid_id: z.string().uuid(),
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

// Cancel a bid (only the bid owner can cancel, and only if it's the highest bid)
export async function DELETE(request: Request) {
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Faca login para cancelar lances' }, { status: 401 })
  }

  // Validate body
  const body = await request.json()
  const result = cancelBidSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Dados invalidos', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const { bid_id } = result.data

  // Get the bid
  const { data: bid, error: bidError } = await supabase
    .from('bids')
    .select('*')
    .eq('id', bid_id)
    .single()

  if (bidError || !bid) {
    return NextResponse.json({ error: 'Lance nao encontrado' }, { status: 404 })
  }

  // Check if user owns this bid
  if (bid.user_id !== user.id) {
    return NextResponse.json({ error: 'Voce so pode cancelar seus proprios lances' }, { status: 403 })
  }

  // Get the vehicle
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', bid.vehicle_id)
    .single()

  if (vehicleError || !vehicle) {
    return NextResponse.json({ error: 'Veiculo nao encontrado' }, { status: 404 })
  }

  // Check if auction is still active
  if (vehicle.status !== 'active') {
    return NextResponse.json({ error: 'Nao e possivel cancelar lances de leiloes encerrados' }, { status: 400 })
  }

  // Check if auction hasn't ended
  const now = new Date()
  const auctionEnd = new Date(vehicle.auction_end)
  if (now > auctionEnd) {
    return NextResponse.json({ error: 'Este leilao ja encerrou' }, { status: 400 })
  }

  // Get the highest bid for this vehicle
  const { data: highestBid } = await supabase
    .from('bids')
    .select('id, amount')
    .eq('vehicle_id', bid.vehicle_id)
    .order('amount', { ascending: false })
    .limit(1)
    .single()

  // Only allow canceling if this is the highest bid
  if (highestBid && highestBid.id !== bid_id) {
    return NextResponse.json({ error: 'Voce so pode cancelar seu lance se ele for o maior lance atual' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Delete the bid
  const { error: deleteError } = await adminClient
    .from('bids')
    .delete()
    .eq('id', bid_id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // Get the new highest bid after deletion
  const { data: newHighestBid } = await supabase
    .from('bids')
    .select('amount')
    .eq('vehicle_id', bid.vehicle_id)
    .order('amount', { ascending: false })
    .limit(1)
    .single()

  // Update vehicle current price to the new highest bid or starting price
  const newPrice = newHighestBid?.amount || vehicle.starting_price
  await adminClient
    .from('vehicles')
    .update({
      current_price: newPrice,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bid.vehicle_id)

  return NextResponse.json({ message: 'Lance cancelado com sucesso', new_price: newPrice })
}
