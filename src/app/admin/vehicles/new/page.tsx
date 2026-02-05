import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VehicleForm } from '@/components/admin/VehicleForm'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'

export default async function NewVehiclePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-gray-900">Novo Veiculo</h1>
          <p className="text-gray-500">Cadastre um novo veiculo para leilao</p>
        </CardHeader>
        <CardContent>
          <VehicleForm mode="create" />
        </CardContent>
      </Card>
    </div>
  )
}
