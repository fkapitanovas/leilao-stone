'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

interface BidItem {
  id: string
  vehicle_id: string
  user_id: string
  amount: number
  created_at: string
  profiles?: { name: string | null; email: string } | null
  vehicles?: { title: string } | null
}

interface BidsTableProps {
  bids: BidItem[]
}

export function BidsTable({ bids }: BidsTableProps) {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  if (bids.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Nenhum lance registrado.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Veiculo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Usuario
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Valor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Data/Hora
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {bids.map((bid) => (
            <tr key={bid.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/auction/${bid.vehicle_id}`}
                  className="text-sm font-medium text-green-600 hover:text-green-700"
                >
                  {bid.vehicles?.title || 'Veiculo'}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {bid.profiles?.name || 'Anonimo'}
                </div>
                <div className="text-xs text-gray-500">
                  {bid.profiles?.email}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-semibold text-green-600">
                  {formatPrice(bid.amount)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(new Date(bid.created_at), "dd/MM/yyyy 'as' HH:mm:ss", {
                  locale: ptBR,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
