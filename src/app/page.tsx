import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Car } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const revalidate = 0

export default async function HomePage() {
  const supabase = await createClient()

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .in('status', ['active', 'scheduled'])
    .order('created_at', { ascending: true })

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Leilão de Veículos em Tempo Real
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Encontre o veículo dos seus sonhos com um preço incrível.
        </p>
      </div>

      {/* Leilão */}
      <section>
        {!vehicles || vehicles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <Car className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum leilão disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <Link key={vehicle.id} href={`/auction/${vehicle.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="relative aspect-[16/10]">
                    {vehicle.images && vehicle.images[0] ? (
                      <Image
                        src={vehicle.images[0]}
                        alt={vehicle.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                        <Car className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 z-20">
                      {vehicle.status === 'active' ? (
                        <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                          AO VIVO
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                          AGENDADO
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {vehicle.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {vehicle.year} - {vehicle.mileage.toLocaleString()} km - {vehicle.color}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">
                          {vehicle.status === 'active' ? 'Lance atual' : 'Lance inicial'}
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          {formatPrice(vehicle.current_price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {vehicle.status === 'active' ? 'Encerra em' : 'Inicia em'}
                        </p>
                        <p className="text-sm font-medium text-gray-700">
                          {format(
                            new Date(vehicle.status === 'active' ? vehicle.auction_end : vehicle.auction_start),
                            "dd/MM 'às' HH:mm",
                            { locale: ptBR }
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
