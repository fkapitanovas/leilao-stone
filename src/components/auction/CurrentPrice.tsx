'use client'

import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'

interface CurrentPriceProps {
  price: number
  previousPrice?: number
}

export function CurrentPrice({ price, previousPrice }: CurrentPriceProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (previousPrice && price > previousPrice) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 500)
      return () => clearTimeout(timer)
    }
  }, [price, previousPrice])

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-gray-600">
        <TrendingUp className="h-4 w-4" />
        <span className="text-sm font-medium">Lance atual</span>
      </div>
      <div
        className={`text-3xl font-bold text-green-600 transition-transform ${
          isAnimating ? 'scale-110' : 'scale-100'
        }`}
      >
        {formatPrice(price)}
      </div>
    </div>
  )
}
