import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BidsTable } from '@/components/admin/BidsTable'
import { Card, CardContent } from '@/components/ui/Card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const revalidate = 0

export default async function BidsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_admin) redirect('/')

  // Fetch bids with separate queries to avoid relation issues
  const { data: bidsData } = await supabase
    .from('bids')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  // Enrich bids with profile and vehicle data
  const bids = await Promise.all(
    (bidsData || []).map(async (bid) => {
      const { data: bidProfile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', bid.user_id)
        .single()

      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('title')
        .eq('id', bid.vehicle_id)
        .single()

      return {
        ...bid,
        profiles: bidProfile,
        vehicles: vehicle,
      }
    })
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/admin" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Historico de Lances</h1>
        <p className="text-gray-500 mt-1">Ultimos 100 lances realizados</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <BidsTable bids={bids} />
        </CardContent>
      </Card>
    </div>
  )
}
