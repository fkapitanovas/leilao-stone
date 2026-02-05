'use client'

import { Vehicle } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Edit, Trash2, StopCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

interface VehicleTableProps {
  vehicles: Vehicle[]
}

export function VehicleTable({ vehicles }: VehicleTableProps) {
  const { addToast } = useToast()
  const router = useRouter()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      ended: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
    }
    const labels = {
      scheduled: 'Agendado',
      active: 'Ativo',
      ended: 'Encerrado',
      cancelled: 'Cancelado',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const endAuction = async (vehicleId: string) => {
    if (!confirm('Tem certeza que deseja encerrar este leilão?')) return

    setActionLoading(vehicleId)
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/end`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao encerrar leilão')
      }

      addToast('success', 'Leilão encerrado com sucesso')
      router.refresh()
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Erro ao encerrar')
    } finally {
      setActionLoading(null)
    }
  }

  const deleteVehicle = async (vehicleId: string) => {
    if (!confirm('Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.')) return

    setActionLoading(vehicleId)
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao excluir veículo')
      }

      addToast('success', 'Veículo excluído')
      router.refresh()
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Erro ao excluir')
    } finally {
      setActionLoading(null)
    }
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Nenhum veículo cadastrado.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Veículo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Preço Atual
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Término
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  {vehicle.images[0] && (
                    <div className="relative h-12 w-16">
                      <Image
                        src={vehicle.images[0]}
                        alt={vehicle.title}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {vehicle.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {vehicle.year} • {vehicle.mileage.toLocaleString()} km
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-green-600">
                  {formatPrice(vehicle.current_price)}
                </div>
                <div className="text-xs text-gray-500">
                  Inicial: {formatPrice(vehicle.starting_price)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(vehicle.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(new Date(vehicle.auction_end), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/auction/${vehicle.id}`}>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/admin/vehicles/${vehicle.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  {vehicle.status === 'active' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => endAuction(vehicle.id)}
                      loading={actionLoading === vehicle.id}
                    >
                      <StopCircle className="h-4 w-4 text-orange-500" />
                    </Button>
                  )}
                  {(vehicle.status === 'scheduled' || vehicle.status === 'cancelled') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteVehicle(vehicle.id)}
                      loading={actionLoading === vehicle.id}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
