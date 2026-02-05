'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Vehicle } from '@/types/database'

const schema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  make: z.string().min(1, 'Marca é obrigatória'),
  model: z.string().min(1, 'Modelo é obrigatório'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  mileage: z.number().min(0),
  color: z.string().min(1, 'Cor é obrigatória'),
  description: z.string().optional(),
  starting_price: z.number().min(0.01, 'Preço inicial deve ser maior que zero'),
  min_bid_increment: z.number().min(0.01, 'Incremento mínimo deve ser maior que zero'),
  auction_start: z.string().min(1, 'Data de início é obrigatória'),
  auction_end: z.string().min(1, 'Data de término é obrigatória'),
})

type FormData = z.infer<typeof schema>

interface VehicleFormProps {
  vehicle?: Vehicle
  mode: 'create' | 'edit'
}

export function VehicleForm({ vehicle, mode }: VehicleFormProps) {
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>(vehicle?.images || [])
  const router = useRouter()
  const { addToast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: vehicle
      ? {
          title: vehicle.title,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          mileage: vehicle.mileage,
          color: vehicle.color,
          description: vehicle.description || '',
          starting_price: vehicle.starting_price,
          min_bid_increment: vehicle.min_bid_increment,
          auction_start: new Date(vehicle.auction_start).toISOString().slice(0, 16),
          auction_end: new Date(vehicle.auction_end).toISOString().slice(0, 16),
        }
      : {
          min_bid_increment: 100,
        },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)

    try {
      const payload = {
        ...data,
        images,
        auction_start: new Date(data.auction_start).toISOString(),
        auction_end: new Date(data.auction_end).toISOString(),
      }

      const url = mode === 'create' ? '/api/vehicles' : `/api/vehicles/${vehicle?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar veículo')
      }

      addToast('success', mode === 'create' ? 'Veículo criado com sucesso!' : 'Veículo atualizado!')
      router.push('/admin')
      router.refresh()
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fotos do veículo
        </label>
        <ImageUpload images={images} onChange={setImages} />
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Título"
          {...register('title')}
          error={errors.title?.message}
          placeholder="Ex: Honda Civic EXL 2020"
        />
        <Input
          label="Marca"
          {...register('make')}
          error={errors.make?.message}
          placeholder="Ex: Honda"
        />
        <Input
          label="Modelo"
          {...register('model')}
          error={errors.model?.message}
          placeholder="Ex: Civic EXL"
        />
        <Input
          label="Ano"
          type="number"
          {...register('year', { valueAsNumber: true })}
          error={errors.year?.message}
          placeholder="2020"
        />
        <Input
          label="Quilometragem (km)"
          type="number"
          {...register('mileage', { valueAsNumber: true })}
          error={errors.mileage?.message}
          placeholder="50000"
        />
        <Input
          label="Cor"
          {...register('color')}
          error={errors.color?.message}
          placeholder="Ex: Preto"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descrição
        </label>
        <textarea
          {...register('description')}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Descreva o estado do veículo, opcionais, etc."
        />
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Preço inicial (R$)"
          type="number"
          step="0.01"
          {...register('starting_price', { valueAsNumber: true })}
          error={errors.starting_price?.message}
          placeholder="50000"
        />
        <Input
          label="Incremento mínimo (R$)"
          type="number"
          step="0.01"
          {...register('min_bid_increment', { valueAsNumber: true })}
          error={errors.min_bid_increment?.message}
          placeholder="100"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Início do leilão"
          type="datetime-local"
          {...register('auction_start')}
          error={errors.auction_start?.message}
        />
        <Input
          label="Fim do leilão"
          type="datetime-local"
          {...register('auction_end')}
          error={errors.auction_end?.message}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <Button type="submit" loading={loading} size="lg">
          {mode === 'create' ? 'Criar veículo' : 'Salvar alterações'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
