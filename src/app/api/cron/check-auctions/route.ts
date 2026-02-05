import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Verify cron secret (mandatory)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('CRON_SECRET environment variable is not set')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  // 1. Activate scheduled auctions that should start
  const { data: toActivate } = await supabase
    .from('vehicles')
    .select('id, title')
    .eq('status', 'scheduled')
    .lte('auction_start', now)

  if (toActivate && toActivate.length > 0) {
    await supabase
      .from('vehicles')
      .update({ status: 'active', updated_at: now })
      .in('id', toActivate.map(v => v.id))
  }

  // 2. End active auctions that have expired
  const { data: toEnd } = await supabase
    .from('vehicles')
    .select('id, title')
    .eq('status', 'active')
    .lte('auction_end', now)

  if (toEnd && toEnd.length > 0) {
    for (const vehicle of toEnd) {
      // Get highest bid
      const { data: highestBid } = await supabase
        .from('bids')
        .select('user_id, amount')
        .eq('vehicle_id', vehicle.id)
        .order('amount', { ascending: false })
        .limit(1)
        .single()

      // Update vehicle
      await supabase
        .from('vehicles')
        .update({
          status: 'ended',
          winner_id: highestBid?.user_id || null,
          final_price: highestBid?.amount || null,
          updated_at: now,
        })
        .eq('id', vehicle.id)

      // Notify winner
      if (highestBid) {
        await supabase.from('notifications').insert({
          user_id: highestBid.user_id,
          type: 'winner',
          message: `Parabens! Voce venceu o leilao do ${vehicle.title}`,
          vehicle_id: vehicle.id,
        })
      }
    }
  }

  return NextResponse.json({
    activated: toActivate?.length || 0,
    ended: toEnd?.length || 0,
    timestamp: now,
  })
}
