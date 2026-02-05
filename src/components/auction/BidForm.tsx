'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Gavel } from 'lucide-react'

interface BidFormProps {
  vehicleId: string
  currentPrice: number
  minIncrement: number
  auctionEnded: boolean
}

export function BidForm({ vehicleId, currentPrice, minIncrement, auctionEnded }: BidFormProps) {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { addToast } = useToast()
  const router = useRouter()

  const minBid = currentPrice + minIncrement

  const schema = z.object({
    amount: z.number()
      .min(minBid, `O lance mínimo é ${formatPrice(minBid)}`),
  })

  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: minBid,
    },
  })

  function formatPrice(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const onSubmit = async (data: FormData) => {
    if (!user) {
      router.push(`/login?redirect=/auction/${vehicleId}`)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: vehicleId,
          amount: data.amount,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao fazer lance')
      }

      addToast('success', 'Lance realizado com sucesso!')
      reset({ amount: data.amount + minIncrement })
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Erro ao fazer lance')
    } finally {
      setLoading(false)
    }
  }

  if (auctionEnded) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg text-center">
        <p className="text-gray-600">Este leilão foi encerrado.</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Faça login para participar do leilão.
        </p>
        <Button onClick={() => router.push(`/login?redirect=/auction/${vehicleId}`)} className="w-full">
          Fazer login
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Seu lance (mínimo: {formatPrice(minBid)})
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            R$
          </span>
          <input
            type="number"
            step="0.01"
            {...register('amount', { valueAsNumber: true })}
            className={`
              w-full pl-10 pr-4 py-3 border rounded-lg text-lg font-semibold
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
              ${errors.amount ? 'border-red-500' : 'border-gray-300'}
            `}
          />
        </div>
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
        )}
      </div>

      <Button type="submit" loading={loading} size="lg" className="w-full">
        <Gavel className="h-5 w-5 mr-2" />
        Fazer lance
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Incremento mínimo: {formatPrice(minIncrement)}
      </p>
    </form>
  )
}
