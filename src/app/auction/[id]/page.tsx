import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { AuctionClient } from './AuctionClient'

export const revalidate = 0

interface Props {
  params: Promise<{ id: string }>
}

export default async function AuctionPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !vehicle) {
    notFound()
  }

  // Fetch bids separately
  const { data: bidsData } = await supabase
    .from('bids')
    .select('*')
    .eq('vehicle_id', id)
    .order('created_at', { ascending: false })

  // Enrich bids with profile data
  const bids = await Promise.all(
    (bidsData || []).map(async (bid) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', bid.user_id)
        .single()

      return {
        ...bid,
        profiles: profile,
      }
    })
  )

  return <AuctionClient vehicle={vehicle} initialBids={bids} />
}
