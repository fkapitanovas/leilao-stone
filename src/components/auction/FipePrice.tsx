'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Loader2, Info } from 'lucide-react'

interface FipeVehicle {
  brand: string
  codeFipe: string
  fuel: string
  model: string
  modelYear: number
  price: string
  referenceMonth: string
}

interface FipePriceProps {
  make: string
  model: string
  year: number
  currentPrice: number
}

export function FipePrice({ make, model, year, currentPrice }: FipePriceProps) {
  const [fipeData, setFipeData] = useState<FipeVehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFipePrice = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `/api/fipe/search?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${year}`
        )

        if (!response.ok) {
          if (response.status === 404) {
            setError('Veículo não encontrado na tabela FIPE')
          } else {
            setError('Erro ao buscar preço FIPE')
          }
          return
        }

        const data = await response.json()
        setFipeData(data)
      } catch (err) {
        console.error('Error fetching FIPE price:', err)
        setError('Erro ao buscar preço FIPE')
      } finally {
        setLoading(false)
      }
    }

    fetchFipePrice()
  }, [make, model, year])

  const parseFipePrice = (priceStr: string): number => {
    // Remove "R$ " and convert "10.000,00" to 10000.00
    return parseFloat(
      priceStr
        .replace('R$ ', '')
        .replace(/\./g, '')
        .replace(',', '.')
    )
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Buscando preço na tabela FIPE...</span>
        </div>
      </div>
    )
  }

  if (error || !fipeData) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-gray-500">
          <Info className="h-4 w-4" />
          <span className="text-sm">{error || 'Preço FIPE não disponível'}</span>
        </div>
      </div>
    )
  }

  const fipePrice = parseFipePrice(fipeData.price)
  const difference = currentPrice - fipePrice
  const percentDiff = ((difference / fipePrice) * 100).toFixed(1)

  let statusColor = 'text-gray-600'
  let bgColor = 'bg-gray-50 border-gray-200'
  let StatusIcon = Minus

  if (difference < -1000) {
    statusColor = 'text-green-600'
    bgColor = 'bg-green-50 border-green-200'
    StatusIcon = TrendingDown
  } else if (difference > 1000) {
    statusColor = 'text-red-600'
    bgColor = 'bg-red-50 border-red-200'
    StatusIcon = TrendingUp
  }

  return (
    <div className={`border rounded-lg p-4 ${bgColor}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">Preço Tabela FIPE</p>
          <p className="text-lg font-bold text-gray-900">{fipeData.price}</p>
          <p className="text-xs text-gray-400 mt-1">
            Ref: {fipeData.referenceMonth}
          </p>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-1 ${statusColor}`}>
            <StatusIcon className="h-4 w-4" />
            <span className="text-sm font-medium">
              {difference > 0 ? '+' : ''}{formatCurrency(difference)}
            </span>
          </div>
          <p className={`text-xs ${statusColor}`}>
            {difference > 0 ? '+' : ''}{percentDiff}% vs FIPE
          </p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Código FIPE: <span className="font-mono">{fipeData.codeFipe}</span>
        </p>
      </div>
    </div>
  )
}
