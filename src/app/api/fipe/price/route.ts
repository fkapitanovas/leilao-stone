import { getFipePrice, VehicleType } from '@/lib/fipe'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const vehicleType = (searchParams.get('type') || 'cars') as VehicleType
    const brandId = searchParams.get('brandId')
    const modelId = searchParams.get('modelId')
    const yearId = searchParams.get('yearId')

    if (!brandId || !modelId || !yearId) {
      return NextResponse.json(
        { error: 'brandId, modelId e yearId são obrigatórios' },
        { status: 400 }
      )
    }

    const price = await getFipePrice(vehicleType, brandId, modelId, yearId)

    return NextResponse.json(price)
  } catch (error) {
    console.error('Error fetching FIPE price:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar preço da FIPE' },
      { status: 500 }
    )
  }
}
