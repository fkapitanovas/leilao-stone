import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VehicleTable } from '@/components/admin/VehicleTable'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Plus, Car, DollarSign, Users } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 0

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false })

  const { count: totalBids } = await supabase
    .from('bids')
    .select('*', { count: 'exact', head: true })

  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const activeAuctions = vehicles?.filter(v => v.status === 'active').length || 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel Admin</h1>
          <p className="text-gray-500 mt-1">Gerencie os leiloes</p>
        </div>
        <Link href="/admin/vehicles/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Veiculo
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Car className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeAuctions}</p>
                <p className="text-sm text-gray-500">Leiloes ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{vehicles?.length || 0}</p>
                <p className="text-sm text-gray-500">Total de veiculos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalBids || 0}</p>
                <p className="text-sm text-gray-500">Total de lances</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalUsers || 0}</p>
                <p className="text-sm text-gray-500">Usuarios</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Veiculos</h2>
            <Link href="/admin/bids" className="text-sm text-green-600 hover:text-green-700">
              Ver todos os lances
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <VehicleTable vehicles={vehicles || []} />
        </CardContent>
      </Card>
    </div>
  )
}
