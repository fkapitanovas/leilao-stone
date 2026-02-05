'use client'

import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { User } from 'lucide-react'

interface BidItem {
  id: string
  user_id: string
  amount: number
  created_at: string
  profiles?: { name: string | null; email: string } | null
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

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
              <div className="h-3 bg-gray-200 rounded w-32" />
            </div>
            <div className="h-5 bg-gray-200 rounded w-20" />
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
          className={`flex items-center gap-3 p-3 rounded-lg ${
            index === 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
          }`}
        >
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {bid.profiles?.name || 'Usuario'}
            </p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(bid.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </div>
          <div className={`text-sm font-semibold ${index === 0 ? 'text-green-600' : 'text-gray-700'}`}>
            {formatPrice(bid.amount)}
          </div>
        </div>
      ))}
    </div>
  )
}
