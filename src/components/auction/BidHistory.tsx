'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { X, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface BidItem {
  id: string
  user_id: string
  amount: number
  created_at: string
}

interface BidHistoryProps {
  bids: BidItem[]
  loading?: boolean
  currentUserId?: string
  onCancelBid?: (bidId: string) => Promise<{ success: boolean; error?: string }>
  auctionEnded?: boolean
}

export function BidHistory({ bids, loading, currentUserId, onCancelBid, auctionEnded }: BidHistoryProps) {
  const [cancelingBidId, setCancelingBidId] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  }

  const handleCancelBid = async (bidId: string) => {
    if (!onCancelBid) return

    setCancelingBidId(bidId)
    setCancelError(null)

    const result = await onCancelBid(bidId)

    if (!result.success) {
      setCancelError(result.error || 'Erro ao cancelar lance')
    }

    setCancelingBidId(null)
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

  // Get the highest bid
  const highestBid = bids[0]
  const canCancelHighestBid =
    currentUserId &&
    highestBid &&
    highestBid.user_id === currentUserId &&
    onCancelBid &&
    !auctionEnded

  return (
    <div className="space-y-3">
      {cancelError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {cancelError}
        </div>
      )}

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {bids.map((bid, index) => {
          const isHighestBid = index === 0
          const isUserBid = currentUserId && bid.user_id === currentUserId
          const showCancelButton = isHighestBid && isUserBid && onCancelBid && !auctionEnded

          return (
            <div
              key={bid.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                isHighestBid ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
              } ${isUserBid ? 'ring-2 ring-blue-200' : ''}`}
            >
              <div className="flex items-center gap-2">
                <div className={`text-base font-semibold ${isHighestBid ? 'text-green-600' : 'text-gray-700'}`}>
                  {formatPrice(bid.amount)}
                </div>
                {isUserBid && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Seu lance
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-500">
                  {formatDateTime(bid.created_at)}
                </div>
                {showCancelButton && (
                  <button
                    onClick={() => handleCancelBid(bid.id)}
                    disabled={cancelingBidId === bid.id}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Cancelar lance"
                  >
                    {cancelingBidId === bid.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {canCancelHighestBid && (
        <p className="text-xs text-gray-500 text-center">
          Você pode cancelar seu lance enquanto for o maior lance.
        </p>
      )}
    </div>
  )
}
