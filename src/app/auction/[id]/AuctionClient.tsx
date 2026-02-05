'use client'

import { Vehicle } from '@/types/database'
import { ImageGallery } from '@/components/auction/ImageGallery'
import { CountdownTimer } from '@/components/auction/CountdownTimer'
import { CurrentPrice } from '@/components/auction/CurrentPrice'
import { BidHistory } from '@/components/auction/BidHistory'
import { BidForm } from '@/components/auction/BidForm'
import { FipePrice } from '@/components/auction/FipePrice'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { useBids } from '@/lib/hooks/useBids'
import { Car, Calendar, Gauge, Palette, Info } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface BidItem {
  id: string
  user_id: string
  amount: number
  created_at: string
  profiles?: { name: string | null; email: string } | null
}

interface AuctionClientProps {
  vehicle: Vehicle
  initialBids: BidItem[]
}

export function AuctionClient({ vehicle, initialBids }: AuctionClientProps) {
  const { bids, currentPrice, loading } = useBids(vehicle.id)
  const displayBids = bids.length > 0 ? bids : initialBids
  const displayPrice = currentPrice || vehicle.current_price

  const isActive = vehicle.status === 'active'
  const isEnded = vehicle.status === 'ended'
  const isScheduled = vehicle.status === 'scheduled'

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Status Banner */}
      {isEnded && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg text-center">
          <p className="text-gray-600 font-medium">
            Este leilao foi encerrado.
            {vehicle.final_price && (
              <span className="text-green-600">
                {' '}Vendido por {formatPrice(vehicle.final_price)}
              </span>
            )}
          </p>
        </div>
      )}

      {isScheduled && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg text-center">
          <p className="text-blue-700 font-medium">
            Este leilao ainda nao comecou. Inicio em{' '}
            {format(new Date(vehicle.auction_start), "dd/MM/yyyy 'as' HH:mm", {
              locale: ptBR,
            })}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images and Details */}
        <div className="lg:col-span-2 space-y-6">
          <ImageGallery images={vehicle.images} title={vehicle.title} />

          <Card>
            <CardHeader>
              <h1 className="text-2xl font-bold text-gray-900">
                {vehicle.title}
              </h1>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Ano</p>
                    <p className="font-semibold">{vehicle.year}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Km</p>
                    <p className="font-semibold">
                      {vehicle.mileage.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Cor</p>
                    <p className="font-semibold">{vehicle.color}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Marca</p>
                    <p className="font-semibold">{vehicle.make}</p>
                  </div>
                </div>
              </div>

              {vehicle.description && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-5 w-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Descricao</h3>
                  </div>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {vehicle.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Bidding */}
        <div className="space-y-6">
          {/* Price Card */}
          <Card>
            <CardContent className="p-6">
              <CurrentPrice
                price={displayPrice}
                previousPrice={vehicle.current_price}
              />
              <div className="mt-4 pt-4 border-t">
                <CountdownTimer endDate={vehicle.auction_end} />
              </div>
            </CardContent>
          </Card>

          {/* FIPE Price */}
          {vehicle.make && vehicle.model && vehicle.year && (
            <FipePrice
              make={vehicle.make}
              model={vehicle.model}
              year={vehicle.year}
              currentPrice={displayPrice}
            />
          )}

          {/* Bid Form */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Fazer lance</h2>
            </CardHeader>
            <CardContent>
              <BidForm
                vehicleId={vehicle.id}
                currentPrice={displayPrice}
                minIncrement={vehicle.min_bid_increment}
                auctionEnded={!isActive}
              />
            </CardContent>
          </Card>

          {/* Bid History */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">
                Historico de lances
              </h2>
            </CardHeader>
            <CardContent>
              <BidHistory bids={displayBids} loading={loading} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
