'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface BidItem {
  id: string
  user_id: string
  amount: number
  created_at: string
}

interface BidHistoryProps {
  bids: BidItem[]
  loading?: boolean
}

export function BidHistory({ bids, loading }: BidHistoryProps) {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="h-5 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>
        ))}
      </div>
    )
  }

  if (bids.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nenhum lance ainda. Seja o primeiro!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {bids.map((bid, index) => (
        <div
          key={bid.id}
          className={`flex items-center justify-between p-3 rounded-lg ${
            index === 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
          }`}
        >
          <div className={`text-base font-semibold ${index === 0 ? 'text-green-600' : 'text-gray-700'}`}>
            {formatPrice(bid.amount)}
          </div>
          <div className="text-sm text-gray-500">
            {formatDateTime(bid.created_at)}
          </div>
        </div>
      ))}
    </div>
  )
}
