import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { VehicleForm } from '@/components/admin/VehicleForm'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditVehiclePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !vehicle) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-gray-900">Editar Veiculo</h1>
          <p className="text-gray-500">{vehicle.title}</p>
        </CardHeader>
        <CardContent>
          <VehicleForm mode="edit" vehicle={vehicle} />
        </CardContent>
      </Card>
    </div>
  )
}
